import { Article, Comment, Workspace } from '../models/index.js';
import { validateArticle } from '../validators.js';
import { DEFAULT_PAGE_SIZE, MAX_COMMENTS_PER_ARTICLE } from '../constants.js';
import { fileService } from './fileService.js';
import sequelize from '../config/database.js';
import path from 'path';
import fs from 'fs/promises';
import { UPLOADS_DIR } from '../constants.js';

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
        { model: Workspace, as: 'Workspace', attributes: ['id', 'name'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: offset
    });
  },

  // Get single article with comments and workspace
  async getArticleById(id) {
    return await Article.findByPk(id, {
      include: [
        { model: Workspace, as: 'Workspace', attributes: ['id', 'name'] },
        { 
          model: Comment, 
          as: 'Comments',
          separate: true,
          limit: MAX_COMMENTS_PER_ARTICLE,
          order: [['createdAt', 'DESC']]
        }
      ]
    });
  },

  // Create new article with validation
  async createArticle(data) {
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

    return await Article.create({
      title: title.trim(),
      content: content.trim(),
      workspace_id
    });
  },

  // Update existing article
  async updateArticle(id, data) {
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

    await article.update({
      title: title.trim(),
      content: content.trim(),
      workspace_id: workspace_id === '' ? null : workspace_id
    });

    return article;
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
    
    const originalName = fileService.fixEncoding(file.originalname);
    const attachment = { filename: file.filename, originalName, size: file.size };
    const currentAttachments = article.attachments || [];
    
    await article.update({
      attachments: [...currentAttachments, attachment]
    });
    
    return attachment;
  },

  // Delete file attachment from article
  async deleteAttachment(articleId, filename) {
    const article = await Article.findByPk(articleId);
    if (!article) {
      throw new Error('Article not found');
    }
    
    const currentAttachments = article.attachments || [];
    const attachment = currentAttachments.find(a => a.filename === filename);
    
    if (!attachment) {
      throw new Error('Attachment not found');
    }
    
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      throw new Error('Invalid filename');
    }
    
    const updatedAttachments = currentAttachments.filter(a => a.filename !== filename);
    
    const transaction = await sequelize.transaction();
    try {
      await article.update({ attachments: updatedAttachments }, { transaction });
      await fs.unlink(path.join(UPLOADS_DIR, filename));
      await transaction.commit();
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
        if (!attachment.filename.includes('..') && !attachment.filename.includes('/') && !attachment.filename.includes('\\')) {
          await fs.unlink(path.join(UPLOADS_DIR, attachment.filename));
        }
      } catch (error) {
        console.error(`Failed to delete file ${attachment.filename}:`, error.message);
      }
    }

    await article.destroy();
    return article;
  }
};