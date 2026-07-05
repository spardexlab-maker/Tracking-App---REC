import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Modal, Input, List, Icon, Loader, Header } from 'semantic-ui-react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import api from '../../../api';
import Paths from '../../../constants/Paths';
import styles from './SearchModal.module.scss';

const SearchModal = React.memo(({ open, onClose }) => {
  const [q, setQ] = useState('');
  const [results, setResults] = useState({ projects: [], boards: [], cards: [] });
  const [loading, setLoading] = useState(false);
  const [t] = useTranslation();

  useEffect(() => {
    if (!open) {
      setQ('');
      setResults({ projects: [], boards: [], cards: [] });
      return;
    }
  }, [open]);

  useEffect(() => {
    if (q.trim().length < 2) {
      setResults({ projects: [], boards: [], cards: [] });
      return;
    }

    setLoading(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        const { item } = await api.projects.globalSearch(q);
        setResults(item || { projects: [], boards: [], cards: [] });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [q]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  return (
    <Modal
      open={open}
      onClose={handleClose}
      size="small"
      className={styles.modal}
      closeIcon
    >
      <Modal.Header className={styles.modalHeader}>
        <Icon name="search" /> {t('action.search', { context: 'title' }) || 'البحث الشامل'}
      </Modal.Header>
      <Modal.Content className={styles.modalContent}>
        <Input
          icon="search"
          placeholder={t('action.search', { context: 'placeholder' }) || 'ابحث عن المشاريع، اللوحات، أو البطاقات...'}
          fluid
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className={styles.searchInput}
          autoFocus
        />
        
        {loading && <Loader active inline="centered" className={styles.loader} />}

        {!loading && q.trim().length >= 2 && (
          <div className={styles.resultsContainer}>
            {/* Projects */}
            {results.projects.length > 0 && (
              <div className={styles.categorySection}>
                <Header as="h4" className={styles.categoryTitle}>
                  <Icon name="folder" /> {t('common.projects') || 'المشاريع'}
                </Header>
                <List divided relaxed className={styles.resultsList}>
                  {results.projects.map((project) => (
                    <List.Item key={project.id} className={styles.resultItem}>
                      <List.Content>
                        <List.Header
                          as={Link}
                          to={Paths.PROJECTS.replace(':id', project.id)}
                          onClick={handleClose}
                          className={styles.resultLink}
                        >
                          {project.name}
                        </List.Header>
                        {project.description && (
                          <List.Description className={styles.resultDescription}>
                            {project.description}
                          </List.Description>
                        )}
                      </List.Content>
                    </List.Item>
                  ))}
                </List>
              </div>
            )}

            {/* Boards */}
            {results.boards.length > 0 && (
              <div className={styles.categorySection}>
                <Header as="h4" className={styles.categoryTitle}>
                  <Icon name="columns" /> {t('common.boards') || 'اللوحات'}
                </Header>
                <List divided relaxed className={styles.resultsList}>
                  {results.boards.map((board) => (
                    <List.Item key={board.id} className={styles.resultItem}>
                      <List.Content>
                        <List.Header
                          as={Link}
                          to={Paths.BOARDS.replace(':id', board.id)}
                          onClick={handleClose}
                          className={styles.resultLink}
                        >
                          {board.name}
                        </List.Header>
                      </List.Content>
                    </List.Item>
                  ))}
                </List>
              </div>
            )}

            {/* Cards */}
            {results.cards.length > 0 && (
              <div className={styles.categorySection}>
                <Header as="h4" className={styles.categoryTitle}>
                  <Icon name="sticky note" /> {t('common.cards') || 'البطاقات'}
                </Header>
                <List divided relaxed className={styles.resultsList}>
                  {results.cards.map((card) => (
                    <List.Item key={card.id} className={styles.resultItem}>
                      <List.Content>
                        <List.Header
                          as={Link}
                          to={Paths.CARDS.replace(':id', card.id)}
                          onClick={handleClose}
                          className={styles.resultLink}
                        >
                          {card.name}
                        </List.Header>
                        {card.description && (
                          <List.Description className={styles.resultDescription}>
                            {card.description.substring(0, 100)}
                            {card.description.length > 100 ? '...' : ''}
                          </List.Description>
                        )}
                      </List.Content>
                    </List.Item>
                  ))}
                </List>
              </div>
            )}

            {results.projects.length === 0 && results.boards.length === 0 && results.cards.length === 0 && (
              <div className={styles.noResults}>
                {t('common.noResults') || 'لا توجد نتائج مطابقة لبحثك.'}
              </div>
            )}
          </div>
        )}
      </Modal.Content>
    </Modal>
  );
});

SearchModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default SearchModal;
