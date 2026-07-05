/*!
 * Copyright (c) 2026 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

module.exports = {
  friendlyName: 'Global Search',
  description: 'Search across all accessible projects, boards, and cards.',

  inputs: {
    q: {
      type: 'string',
      required: true,
    },
  },

  exits: {
    success: {
      responseType: 'ok',
    },
  },

  async fn(inputs) {
    const { currentUser } = this.req;
    const q = inputs.q.trim();

    if (!q || q.length < 2) {
      return {
        item: {
          projects: [],
          boards: [],
          cards: [],
        },
      };
    }

    // 1. Get accessible projects & boards (Scoper logic)
    const managerProjectIds = await sails.helpers.users.getManagerProjectIds(currentUser.id);
    const fullyVisibleProjectIds = [...managerProjectIds];

    let sharedProjects = [];
    let sharedProjectIds = [];
    if (currentUser.role === User.Roles.ADMIN) {
      sharedProjects = await Project.qm.getShared({
        exceptIdOrIds: managerProjectIds,
      });
      sharedProjectIds = sails.helpers.utils.mapRecords(sharedProjects);
      fullyVisibleProjectIds.push(...sharedProjectIds);
    }

    const boardMemberships = await BoardMembership.qm.getByUserId(currentUser.id);
    const membershipBoardIds = sails.helpers.utils.mapRecords(boardMemberships, 'boardId');

    const membershipBoards = await Board.qm.getByIds(membershipBoardIds, {
      exceptProjectIdOrIds: fullyVisibleProjectIds,
    });

    const membershipProjectIds = sails.helpers.utils.mapRecords(
      membershipBoards,
      'projectId',
      true,
    );

    const projectIds = _.union(managerProjectIds, membershipProjectIds, sharedProjectIds);
    const fullyVisibleBoards = await Board.qm.getByProjectIds(fullyVisibleProjectIds);
    const boards = [...fullyVisibleBoards, ...membershipBoards];
    const boardIds = boards.map((b) => b.id);

    // 2. Query Projects
    const matchedProjects = await Project.find({
      id: projectIds,
      or: [
        { name: { contains: q } },
        { description: { contains: q } },
      ],
    }).limit(10);

    // 3. Query Boards
    const matchedBoards = await Board.find({
      id: boardIds,
      name: { contains: q },
    }).limit(10);

    // 4. Query Cards
    const lists = await List.find({ boardId: boardIds });
    const listIds = lists.map((l) => l.id);

    let matchedCards = await Card.find({
      listId: listIds,
      or: [
        { name: { contains: q } },
        { description: { contains: q } },
      ],
    }).limit(30);

    // Filter GUEST cards
    const guestMemberships = boardMemberships.filter((bm) => bm.role === 'guest');
    const guestBoardIds = guestMemberships.map((bm) => bm.boardId);

    if (guestBoardIds.length > 0) {
      const myCardMemberships = await CardMembership.find({ userId: currentUser.id });
      const myCardIds = myCardMemberships.map((cm) => cm.cardId);

      matchedCards = matchedCards.filter((card) => {
        const list = lists.find((l) => l.id === card.listId);
        if (!list) return false;
        if (guestBoardIds.includes(list.boardId)) {
          return myCardIds.includes(card.id);
        }
        return true;
      });
    }

    // Map cards to include boardId for routing
    const populatedCards = matchedCards.map((card) => {
      const list = lists.find((l) => l.id === card.listId);
      return {
        ...card,
        boardId: list ? list.boardId : null,
      };
    });

    return {
      item: {
        projects: matchedProjects,
        boards: matchedBoards,
        cards: populatedCards,
      },
    };
  },
};
