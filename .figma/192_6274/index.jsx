import React from 'react';

import styles from './index.module.scss';

const Component = () => {
  return (
    <div className={styles.drawer}>
      <div className={styles.aItemDrawerHeader}>
        <p className={styles.title}>新建字典值</p>
        <div className={styles.itemCloseBtn}>
          <img src="../image/miljfu18-t1rkf9r.svg" className={styles.frame} />
        </div>
      </div>
      <div className={styles.itemFormTop}>
        <p className={styles.title2}>编号</p>
        <div className={styles.instance}>
          <p className={styles.placeholder}>D2342342</p>
        </div>
      </div>
      <div className={styles.itemFormTop2}>
        <p className={styles.title2}>字典值</p>
        <div className={styles.instance2}>
          <p className={styles.placeholder}>XXX</p>
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
