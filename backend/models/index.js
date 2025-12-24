import Article from './Article.js';
import ArticleVersion from './ArticleVersion.js';
import Workspace from './Workspace.js';
import Comment from './Comment.js';

// Define database model associations
Article.belongsTo(Workspace, { foreignKey: 'workspace_id', as: 'Workspace' });
Article.hasMany(Comment, {
  foreignKey: 'article_id',
  as: 'Comments',
  onDelete: 'CASCADE',
});

Workspace.hasMany(Article, { foreignKey: 'workspace_id', as: 'Articles' });

Comment.belongsTo(Article, { foreignKey: 'article_id', as: 'Article' });

Article.hasMany(ArticleVersion, {
  foreignKey: 'article_id',
  as: 'Versions',
  onDelete: 'CASCADE',
});
ArticleVersion.belongsTo(Article, { foreignKey: 'article_id', as: 'Article' });
ArticleVersion.belongsTo(Workspace, {
  foreignKey: 'workspace_id',
  as: 'Workspace',
});

export { Article, ArticleVersion, Workspace, Comment };
