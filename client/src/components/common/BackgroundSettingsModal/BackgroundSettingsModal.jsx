import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Modal, Button, Form, Radio, Header, Icon } from 'semantic-ui-react';
import { useTranslation } from 'react-i18next';
import styles from './BackgroundSettingsModal.module.scss';

const BackgroundSettingsModal = React.memo(({ open, onClose }) => {
  const [bgType, setBgType] = useState(() => localStorage.getItem('app-background-type') || 'network');
  const [bgImage, setBgImage] = useState(() => localStorage.getItem('app-background-image') || '');
  const [t] = useTranslation();

  const handleSave = useCallback(() => {
    localStorage.setItem('app-background-type', bgType);
    if (bgType === 'image') {
      localStorage.setItem('app-background-image', bgImage);
    } else {
      localStorage.removeItem('app-background-image');
    }
    // Reload page to apply new background
    window.location.reload();
  }, [bgType, bgImage]);

  const handleImageUpload = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setBgImage(event.target.result);
      setBgType('image');
    };
    reader.readAsDataURL(file);
  }, []);

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="small"
      className={styles.modal}
      closeIcon
    >
      <Modal.Header className={styles.modalHeader}>
        <Icon name="theme" /> {t('common.backgroundSettings') || 'إعدادات الخلفية'}
      </Modal.Header>
      <Modal.Content className={styles.modalContent}>
        <Form className={styles.form}>
          <Form.Field className={styles.field}>
            <Radio
              label={t('common.bgNetwork') || 'الشبكة ثلاثية الأبعاد المضيئة (الافتراضية)'}
              name="bgType"
              value="network"
              checked={bgType === 'network'}
              onChange={() => setBgType('network')}
              className={styles.radio}
            />
          </Form.Field>
          <Form.Field className={styles.field}>
            <Radio
              label={t('common.bgStars') || 'فضاء النجوم المتلألئة (Space Stars)'}
              name="bgType"
              value="stars"
              checked={bgType === 'stars'}
              onChange={() => setBgType('stars')}
              className={styles.radio}
            />
          </Form.Field>
          <Form.Field className={styles.field}>
            <Radio
              label={t('common.bgWaves') || 'أشعة الأمواج المتموجة (3D Waves)'}
              name="bgType"
              value="waves"
              checked={bgType === 'waves'}
              onChange={() => setBgType('waves')}
              className={styles.radio}
            />
          </Form.Field>
          <Form.Field className={styles.field}>
            <Radio
              label={t('common.bgNone') || 'خلفية داكنة سادة (بدون تأثيرات)'}
              name="bgType"
              value="none"
              checked={bgType === 'none'}
              onChange={() => setBgType('none')}
              className={styles.radio}
            />
          </Form.Field>
          <Form.Field className={styles.field}>
            <Radio
              label={t('common.bgImage') || 'تحميل صورة خلفية مخصصة'}
              name="bgType"
              value="image"
              checked={bgType === 'image'}
              onChange={() => setBgType('image')}
              className={styles.radio}
            />
          </Form.Field>

          {bgType === 'image' && (
            <div className={styles.uploadSection}>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                id="bg-upload-input"
                style={{ display: 'none' }}
              />
              <label htmlFor="bg-upload-input">
                <Button as="span" content={t('action.selectImage') || 'اختر صورة من جهازك'} icon="upload" labelPosition="left" className={styles.uploadBtn} />
              </label>
              {bgImage && (
                <div className={styles.previewContainer}>
                  <img src={bgImage} alt="Preview" className={styles.previewImage} />
                </div>
              )}
            </div>
          )}
        </Form>
      </Modal.Content>
      <Modal.Actions className={styles.modalActions}>
        <Button onClick={onClose} className={styles.cancelBtn}>
          {t('action.cancel') || 'إلغاء'}
        </Button>
        <Button onClick={handleSave} className={styles.saveBtn}>
          {t('action.save') || 'حفظ وتطبيق'}
        </Button>
      </Modal.Actions>
    </Modal>
  );
});

BackgroundSettingsModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default BackgroundSettingsModal;
