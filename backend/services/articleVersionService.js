import { ArticleVersion, Workspace, Comment, User } from '../models/index.js';
import { MAX_COMMENTS_PER_ARTICLE } from '../constants.js';

async function getNextVersionNumber(articleId, transaction) {
  const latestVersion = await ArticleVersion.findOne({
    where: { article_id: articleId },
    order: [['version_number', 'DESC']],
    transaction,
    lock: transaction.LOCK.UPDATE,
  });
  return latestVersion ? latestVersion.version_number + 1 : 1;
}

async function createVersionWithRetry({ transaction, article, versionNumber }, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await ArticleVersion.create({
        article_id: article.id,
        title: article.title,
        content: article.content,
        workspace_id: article.workspace_id,
        attachments: article.attachments,
        version_number: versionNumber,
        user_id: article.user_id,
      }, { transaction });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError' && attempt < maxRetries - 1) {
        versionNumber = await getNextVersionNumber(article.id, transaction);
        continue;
      }
      throw error;
    }
  }
}

export const articleVersionService = {
  async createNewVersion(article, transaction) {
    const versionNumber = await getNextVersionNumber(article.id, transaction);
    return createVersionWithRetry({ transaction, article, versionNumber });
  },

  async getArticleVersions(articleId) {
    return await ArticleVersion.findAll({
      where: { article_id: articleId },
      include: [{ model: Workspace, as: 'Workspace', attributes: ['id', 'name'] }],
      order: [['version_number', 'DESC']],
    });
  },

  async getArticleVersion(articleId, versionNumber) {
    const version = await ArticleVersion.findOne({
      where: { article_id: articleId, version_number: versionNumber },
      include: [{ model: Workspace, as: 'Workspace', attributes: ['id', 'name'] }],
    });

    if (!version) {
      throw new Error('Article version not found');
    }

    // Load comments for the article (comments are shared across versions)
    const comments = await Comment.findAll({
      where: { article_id: articleId },
      include: [{ model: User, as: 'User', attributes: ['id', 'email'] }],
      order: [['createdAt', 'DESC']],
      limit: MAX_COMMENTS_PER_ARTICLE,
    });

    return { ...version.toJSON(), Comments: comments };
  },

  async isFileUsedInVersions(articleId, filename, transaction) {
    const versions = await ArticleVersion.findAll({
      where: { article_id: articleId },
      attributes: ['attachments'],
      transaction
    });

    return versions.some(version => {
      const attachments = version.attachments || [];
      return attachments.some(att => att.filename === filename);
    });
  },
};
