/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     description: Retrieves a list of all users. Requires admin or project owner privileges.
 *     tags:
 *       - Users
 *     operationId: getUsers
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - items
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */

const Errors = {
  NOT_ENOUGH_RIGHTS: {
    notEnoughRights: 'Not enough rights',
  },
};

module.exports = {
  exits: {
    notEnoughRights: {
      responseType: 'forbidden',
    },
  },

  async fn() {
    const { currentUser } = this.req;
    let users;

    if (sails.helpers.users.isAdminOrProjectOwner(currentUser)) {
      users = await User.qm.getAll();
    } else {
      // Find all projects the current user is manager of
      const managedPms = await ProjectManager.find({ userId: currentUser.id });
      const managedProjectIds = managedPms.map(pm => pm.projectId);

      // Find all boards the current user is member of
      const boardMemberships = await BoardMembership.find({ userId: currentUser.id });
      const boardIds = boardMemberships.map(bm => bm.boardId);

      let boardProjectIds = [];
      if (boardIds.length > 0) {
        const boards = await Board.find({ id: boardIds });
        boardProjectIds = boards.map(b => b.projectId);
      }

      const accessibleProjectIds = _.uniq([...managedProjectIds, ...boardProjectIds]);

      if (accessibleProjectIds.length === 0) {
        users = await User.find({ id: currentUser.id });
      } else {
        // Find all managers of these projects
        const pmUsers = await ProjectManager.find({ projectId: accessibleProjectIds });
        const pmUserIds = pmUsers.map(pm => pm.userId);

        // Find all boards in these projects
        const projectBoards = await Board.find({ projectId: accessibleProjectIds });
        const projectBoardIds = projectBoards.map(b => b.id);

        // Find all members of these boards
        let bmUserIds = [];
        if (projectBoardIds.length > 0) {
          const bmUsers = await BoardMembership.find({ boardId: projectBoardIds });
          bmUserIds = bmUsers.map(bm => bm.userId);
        }

        const visibleUserIds = _.uniq([currentUser.id, ...pmUserIds, ...bmUserIds]);
        users = await User.find({ id: visibleUserIds });
      }
    }

    return {
      items: sails.helpers.users.presentMany(users, currentUser),
    };
  },
};
