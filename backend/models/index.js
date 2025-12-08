import Article from './Article.js';
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

export { Article, Workspace, Comment };
