import React from 'react';

import styles from './index.module.scss';

const Component = () => {
  return (
    <div className={styles.drawer}>
      <div className={styles.aItemDrawerHeader}>
        <p className={styles.title}>新建字典</p>
        <div className={styles.itemCloseBtn}>
          <img src="../image/miljfu0w-a0fkwln.svg" className={styles.frame} />
        </div>
      </div>
      <div className={styles.itemFormTop}>
        <p className={styles.title2}>字典名</p>
        <div className={styles.instance}>
          <p className={styles.placeholder}>D2342342</p>
        </div>
      </div>
      <div className={styles.btnGroup}>
        <div className={styles.button}>
          <p className={styles.text}>确定</p>
        </div>
        <div className={styles.button2}>
          <p className={styles.text2}>取消</p>
        </div>
      </div>
    </div>
  );
}

export default Component;
