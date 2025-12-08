'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Skip seeding if workspaces already exist to prevent duplicates
    const existingWorkspaces = await queryInterface.sequelize.query(
      'SELECT COUNT(*) as count FROM workspaces',
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    if (existingWorkspaces[0].count > 0) {
      console.log('Workspaces already exist, skipping seed...');
      return;
    }


    await queryInterface.bulkInsert('workspaces', [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        name: 'General',
        description: 'General articles and discussions',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        name: 'Technology',
        description: 'Technology-related articles',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        name: 'Science',
        description: 'Scientific articles and research',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440004',
        name: 'Business',
        description: 'Business and entrepreneurship',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('workspaces', {
      id: [
        '550e8400-e29b-41d4-a716-446655440001',
        '550e8400-e29b-41d4-a716-446655440002',
        '550e8400-e29b-41d4-a716-446655440003',
        '550e8400-e29b-41d4-a716-446655440004',
      ],
    });
  },
};
