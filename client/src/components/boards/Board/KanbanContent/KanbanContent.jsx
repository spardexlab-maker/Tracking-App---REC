/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import { useDidUpdate } from '../../../../lib/hooks';
import { closePopup } from '../../../../lib/popup';

import selectors from '../../../../selectors';
import entryActions from '../../../../entry-actions';
import parseDndId from '../../../../utils/parse-dnd-id';
import DroppableTypes from '../../../../constants/DroppableTypes';
import { BoardMembershipRoles } from '../../../../constants/Enums';
import AddList from './AddList';
import List from '../../../lists/List';
import PlusMathIcon from '../../../../assets/images/plus-math-icon.svg?react';

import styles from './KanbanContent.module.scss';
import globalStyles from '../../../../styles.module.scss';

const KanbanContent = React.memo(() => {
  const listIds = useSelector(selectors.selectKanbanListIdsForCurrentBoard);

  const canAddList = useSelector((state) => {
    const boardMembership = selectors.selectCurrentUserMembershipForCurrentBoard(state);
    return !!boardMembership && boardMembership.role === BoardMembershipRoles.EDITOR;
  });

  const dispatch = useDispatch();
  const [t] = useTranslation();
  const [isAddListOpened, setIsAddListOpened] = useState(false);

  const wrapperRef = useRef(null);
  const prevPositionRef = useRef(null);
  const activeTabRef = useRef(null);
  const handleMouseMoveRef = useRef(null);

  const handleDragStart = useCallback((initial) => {
    document.body.classList.add(globalStyles.dragging);
    closePopup();

    if (initial) {
      const { draggableId, type } = initial;
      window.currentlyDraggedItem = {
        id: parseDndId(draggableId),
        type: type === DroppableTypes.LIST ? 'list' : 'card',
      };
      window.hoveredBoardId = null;

      if (type === DroppableTypes.LIST) {
        document.body.dataset.draggingType = 'list';
      } else {
        document.body.dataset.draggingType = 'card';
      }

      // Add coordinate-based mouse tracker to detect drop targets on board tabs
      activeTabRef.current = null;
      const handleMouseMove = (event) => {
        const element = document.elementFromPoint(event.clientX, event.clientY);
        const tabElement = element ? element.closest('[data-board-id]') : null;

        if (tabElement) {
          const boardId = tabElement.getAttribute('data-board-id');
          if (window.hoveredBoardId !== boardId) {
            if (activeTabRef.current) {
              activeTabRef.current.classList.remove('board-tab-hovered');
            }
            window.hoveredBoardId = boardId;
            tabElement.classList.add('board-tab-hovered');
            activeTabRef.current = tabElement;
          }
        } else {
          if (window.hoveredBoardId !== null) {
            window.hoveredBoardId = null;
            if (activeTabRef.current) {
              activeTabRef.current.classList.remove('board-tab-hovered');
              activeTabRef.current = null;
            }
          }
        }
      };

      handleMouseMoveRef.current = handleMouseMove;
      window.addEventListener('mousemove', handleMouseMove);
    }
  }, []);

  const handleDragEnd = useCallback(
    ({ draggableId, type, source, destination }) => {
      document.body.classList.remove(globalStyles.dragging);
      delete document.body.dataset.draggingType;

      if (handleMouseMoveRef.current) {
        window.removeEventListener('mousemove', handleMouseMoveRef.current);
        handleMouseMoveRef.current = null;
      }
      if (activeTabRef.current) {
        activeTabRef.current.classList.remove('board-tab-hovered');
        activeTabRef.current = null;
      }

      const draggedId = window.currentlyDraggedItem ? window.currentlyDraggedItem.id : parseDndId(draggableId);
      const draggedType = window.currentlyDraggedItem ? window.currentlyDraggedItem.type : (type === DroppableTypes.LIST ? 'list' : 'card');
      const targetBoardId = window.hoveredBoardId;

      window.currentlyDraggedItem = null;
      window.hoveredBoardId = null;

      if (targetBoardId) {
        if (draggedType === 'list') {
          dispatch(entryActions.transferList(draggedId, targetBoardId));
        }
        return;
      }

      if (!destination) {
        return;
      }

      if (source.droppableId === destination.droppableId && source.index === destination.index) {
        return;
      }

      const id = parseDndId(draggableId);

      switch (type) {
        case DroppableTypes.LIST:
          dispatch(entryActions.moveList(id, destination.index));

          break;
        case DroppableTypes.CARD:
          dispatch(
            entryActions.moveCard(id, parseDndId(destination.droppableId), destination.index),
          );

          break;
        default:
      }
    },
    [dispatch],
  );

  const handleAddListClick = useCallback(() => {
    setIsAddListOpened(true);
  }, []);

  const handleAddListClose = useCallback(() => {
    setIsAddListOpened(false);
  }, []);

  const handleMouseDown = useCallback((event) => {
    // If button is defined and not equal to 0 (left click)
    if (event.button) {
      return;
    }

    if (event.target !== wrapperRef.current && !event.target.dataset.dragScroller) {
      return;
    }

    prevPositionRef.current = event.clientX;

    window.getSelection().removeAllRanges();
    document.body.classList.add(globalStyles.dragScrolling);
  }, []);

  const handleWindowMouseMove = useCallback((event) => {
    if (prevPositionRef.current === null) {
      return;
    }

    event.preventDefault();

    window.scrollBy({
      left: prevPositionRef.current - event.clientX,
    });

    prevPositionRef.current = event.clientX;
  }, []);

  const handleWindowMouseRelease = useCallback(() => {
    if (prevPositionRef.current === null) {
      return;
    }

    prevPositionRef.current = null;
    document.body.classList.remove(globalStyles.dragScrolling);
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleWindowMouseMove);

    window.addEventListener('mouseup', handleWindowMouseRelease);
    window.addEventListener('blur', handleWindowMouseRelease);
    window.addEventListener('contextmenu', handleWindowMouseRelease);

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);

      window.removeEventListener('mouseup', handleWindowMouseRelease);
      window.removeEventListener('blur', handleWindowMouseRelease);
      window.removeEventListener('contextmenu', handleWindowMouseRelease);
    };
  }, [handleWindowMouseMove, handleWindowMouseRelease]);

  useDidUpdate(() => {
    if (isAddListOpened) {
      window.scroll(document.body.scrollWidth, 0);
    }
  }, [listIds, isAddListOpened]);

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div ref={wrapperRef} className={styles.wrapper} onMouseDown={handleMouseDown}>
      <div>
        <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <Droppable droppableId="board" type={DroppableTypes.LIST} direction="horizontal">
            {({ innerRef, droppableProps, placeholder }) => (
              <div
                {...droppableProps} // eslint-disable-line react/jsx-props-no-spreading
                data-drag-scroller
                ref={innerRef}
                className={styles.lists}
              >
                {listIds.map((listId, index) => (
                  <List key={listId} id={listId} index={index} />
                ))}
                {placeholder}
                {canAddList && (
                  <div data-drag-scroller className={styles.list}>
                    {isAddListOpened ? (
                      <AddList onClose={handleAddListClose} />
                    ) : (
                      <button
                        type="button"
                        className={styles.addListButton}
                        onClick={handleAddListClick}
                      >
                        <PlusMathIcon className={styles.addListButtonIcon} />
                        <span className={styles.addListButtonText}>
                          {listIds.length > 0 ? t('action.addAnotherList') : t('action.addList')}
                        </span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </div>
  );
});

export default KanbanContent;
