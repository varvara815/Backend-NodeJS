import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Article = sequelize.define('Article', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  attachments: {
    type: DataTypes.JSON,
    defaultValue: [],
    validate: {
      isArray(value) {
        if (!Array.isArray(value)) {
          throw new Error('Attachments must be an array');
        }
      }
    }
  }
}, {
  tableName: 'articles',
  timestamps: true
});

export default Article;
