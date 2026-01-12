import Article from './Article.js';
import ArticleVersion from './ArticleVersion.js';
import Workspace from './Workspace.js';
import Comment from './Comment.js';
import User from './User.js';

// Define database model associations
Article.belongsTo(Workspace, { foreignKey: 'workspace_id', as: 'Workspace' });
Article.belongsTo(User, { foreignKey: 'user_id', as: 'User' });
Article.hasMany(Comment, {
  foreignKey: 'article_id',
  as: 'Comments',
  onDelete: 'CASCADE',
});

Workspace.hasMany(Article, { foreignKey: 'workspace_id', as: 'Articles' });

Comment.belongsTo(Article, { foreignKey: 'article_id', as: 'Article' });
Comment.belongsTo(User, { foreignKey: 'user_id', as: 'User' });

User.hasMany(Comment, { foreignKey: 'user_id', as: 'Comments', onDelete: 'CASCADE' });
User.hasMany(Article, { foreignKey: 'user_id', as: 'Articles', onDelete: 'CASCADE' });
User.hasMany(ArticleVersion, { foreignKey: 'user_id', as: 'ArticleVersions', onDelete: 'CASCADE' });

Article.hasMany(ArticleVersion, {
  foreignKey: 'article_id',
  as: 'Versions',
  onDelete: 'CASCADE',
});
ArticleVersion.belongsTo(Article, { foreignKey: 'article_id', as: 'Article' });
ArticleVersion.belongsTo(User, { foreignKey: 'user_id', as: 'User' });
ArticleVersion.belongsTo(Workspace, {
  foreignKey: 'workspace_id',
  as: 'Workspace',
});

export { Article, ArticleVersion, Workspace, Comment, User };
