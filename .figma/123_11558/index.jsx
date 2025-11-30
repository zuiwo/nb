import React from 'react';

import styles from './index.module.scss';

const Component = () => {
  return (
    <div className={styles.frame2}>
      <div className={styles.aItemDrawerHeader}>
        <p className={styles.title}>新建客户</p>
        <div className={styles.itemCloseBtn}>
          <img src="../image/miltcjht-0z9xel8.svg" className={styles.frame} />
        </div>
      </div>
      <div className={styles.frame23}>
        <div className={styles.form}>
          <div className={styles.itemFormTop}>
            <p className={styles.title2}>客户编号</p>
            <div className={styles.instance}>
              <p className={styles.placeholder}>D2342342</p>
            </div>
          </div>
          <div className={styles.itemFormTop}>
            <p className={styles.title2}>客户姓名</p>
            <div className={styles.instance}>
              <p className={styles.placeholder}>D2342342</p>
            </div>
          </div>
          <div className={styles.itemFormTop}>
            <p className={styles.title2}>公司名</p>
            <div className={styles.instance}>
              <p className={styles.placeholder}>D2342342</p>
            </div>
          </div>
        </div>
        <div className={styles.form}>
          <div className={styles.itemFormTop}>
            <p className={styles.title2}>手机号</p>
            <div className={styles.instance}>
              <p className={styles.placeholder}>D2342342</p>
            </div>
          </div>
          <div className={styles.itemFormTop}>
            <p className={styles.title2}>地址</p>
            <div className={styles.instance}>
              <p className={styles.placeholder}>XX省XX市XX区</p>
            </div>
          </div>
          <div className={styles.itemFormTop}>
            <p className={styles.title2}>备注</p>
            <div className={styles.instance}>
              <p className={styles.placeholder}>D2342342</p>
            </div>
          </div>
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
