import {
  Article,
  Comment,
  Workspace,
  User,
} from '../models/index.js';
import { validateArticle } from '../validators.js';
import {
  DEFAULT_PAGE_SIZE,
  MAX_COMMENTS_PER_ARTICLE,
  FILE_SIZE_LIMIT,
} from '../constants.js';
import { fileService } from './fileService.js';
import sequelize from '../config/database.js';
import path from 'path';
import fs from 'fs/promises';
import { UPLOADS_DIR } from '../constants.js';
import { articleVersionService } from './articleVersionService.js';

export const articleService = {
  // Get articles with filtering and pagination
  async getArticles(query) {
    const { workspace_id, page = 1, limit = DEFAULT_PAGE_SIZE } = query;
    let whereClause = {};

    if (workspace_id === 'null') {
      whereClause = { workspace_id: null };
    } else if (workspace_id) {
      whereClause = { workspace_id };
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    return await Article.findAll({
      where: whereClause,
      include: [
        { model: Workspace, as: 'Workspace', attributes: ['id', 'name'] },
        { model: User, as: 'User', attributes: ['id', 'email'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: offset,
    });
  },

  // Get single article with comments and workspace
  async getArticleById(id) {
    return await Article.findByPk(id, {
      include: [
        { model: Workspace, as: 'Workspace', attributes: ['id', 'name'] },
        { model: User, as: 'User', attributes: ['id', 'email'] },
        {
          model: Comment,
          as: 'Comments',
          include: [{ model: User, as: 'User', attributes: ['id', 'email'] }],
          separate: true,
          limit: MAX_COMMENTS_PER_ARTICLE,
          order: [['createdAt', 'DESC']],
        },
      ],
    });
  },

  // Create new article with validation
  async createArticle(data, userId) {
    const { title, content, workspace_id } = data;
    const errors = validateArticle(title, content);
    if (errors.length > 0) {
      throw new Error(errors[0]);
    }

    if (workspace_id) {
      const workspace = await Workspace.findByPk(workspace_id);
      if (!workspace) {
        throw new Error('Workspace not found');
      }
    }

    const transaction = await sequelize.transaction();
    try {
      const article = await Article.create(
        {
          title: title.trim(),
          content: content.trim(),
          workspace_id,
          user_id: userId,
        },
        { transaction }
      );

      // Create initial version
      await articleVersionService.createNewVersion(article, transaction, 1);

      await transaction.commit();
      return article;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  // Update existing article with versioning
  async updateArticle(id, data, userId) {
    const { title, content, workspace_id } = data;
    const errors = validateArticle(title, content);
    if (errors.length > 0) {
      throw new Error(errors[0]);
    }

    if (workspace_id) {
      const workspace = await Workspace.findByPk(workspace_id);
      if (!workspace) {
        throw new Error('Workspace not found');
      }
    }

    const article = await Article.findByPk(id);
    if (!article) {
      throw new Error('Article not found');
    }

    const transaction = await sequelize.transaction();
    try {
      // Update current article
      await article.update(
        {
          title: title.trim(),
          content: content.trim(),
          workspace_id: workspace_id === '' ? null : workspace_id,
          user_id: userId,
        },
        { transaction }
      );

      // Get fresh article data and create version
      const updatedArticle = await Article.findByPk(id, { transaction });
      await articleVersionService.createNewVersion(updatedArticle, transaction);

      await transaction.commit();
      return article;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  // Add file attachment to article
  async addAttachment(articleId, file) {
    const article = await Article.findByPk(articleId);
    if (!article) {
      throw new Error('Article not found');
    }

    if (!file) {
      throw new Error('Invalid file type. Only JPG, PNG, GIF, and PDF allowed');
    }

    if (file.size > FILE_SIZE_LIMIT) {
      throw new Error('File size exceeds 10MB limit');
    }

    const originalName = fileService.fixEncoding(file.originalname);
    const attachment = {
      filename: file.filename,
      originalName,
      size: file.size,
    };
    const currentAttachments = article.attachments || [];

    const transaction = await sequelize.transaction();
    try {
      const updatedAttachments = [...currentAttachments, attachment];
      await article.update(
        {
          attachments: updatedAttachments,
        },
        { transaction }
      );

      // Get fresh article data and create new version
      const updatedArticle = await Article.findByPk(articleId, { transaction });
      await articleVersionService.createNewVersion(updatedArticle, transaction);

      await transaction.commit();
      return attachment;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  // Delete file attachment from article
  async deleteAttachment(articleId, filename) {
    const article = await Article.findByPk(articleId);
    if (!article) {
      throw new Error('Article not found');
    }

    const currentAttachments = article.attachments || [];
    const attachment = currentAttachments.find((a) => a.filename === filename);

    if (!attachment) {
      throw new Error('Attachment not found');
    }

    const resolvedPath = path.resolve(UPLOADS_DIR, filename);
    if (!resolvedPath.startsWith(path.resolve(UPLOADS_DIR))) {
      throw new Error('Invalid filename');
    }

    const updatedAttachments = currentAttachments.filter(
      (a) => a.filename !== filename
    );

    const transaction = await sequelize.transaction();
    try {
      // Check if file is used in other versions BEFORE creating new version
      const isUsedInOtherVersions = await articleVersionService.isFileUsedInVersions(articleId, filename, transaction);
      
      await article.update(
        { attachments: updatedAttachments },
        { transaction }
      );

      // Get fresh article data and create new version
      const updatedArticle = await Article.findByPk(articleId, { transaction });
      await articleVersionService.createNewVersion(updatedArticle, transaction);
      
      await transaction.commit();
      
      if (!isUsedInOtherVersions) {
        await fs.unlink(path.join(UPLOADS_DIR, filename));
      }
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  // Delete article and all its files
  async deleteArticle(id) {
    const article = await Article.findByPk(id);
    if (!article) {
      throw new Error('Article not found');
    }

    const attachments = article.attachments || [];
    for (const attachment of attachments) {
      try {
        const resolvedPath = path.resolve(UPLOADS_DIR, attachment.filename);
        if (resolvedPath.startsWith(path.resolve(UPLOADS_DIR))) {
          await fs.unlink(resolvedPath);
        }
      } catch (error) {
        console.error(
          `Failed to delete file ${attachment.filename}:`,
          error.message
        );
      }
    }

    await article.destroy();
    return article;
  },
};
