import * as React from 'react';

import styles from 'styles/Table.module.css';

const px = (pixels) => `${pixels}px`;

export default function Table({
  header,
  columns = [],
  children,
  loading,
  loadingRows = 4,
  loadingWidths = [],
}) {
  return (
    <div className={styles.container}>
      <div className={styles.header}>{header}</div>
      <div className={styles.table}>
        <table>
          <thead>
            <tr>
              {columns.map((column, i) => {
                return <td key={i}>{column}</td>;
              })}
            </tr>
          </thead>

          {loading ? (
            <tbody>
              {new Array(loadingRows).fill(1).map((_, i) => {
                return (
                  <tr key={i}>
                    {columns.map((_, i) => {
                      const colLoadingWidth = loadingWidths[i];
                      if (
                        typeof colLoadingWidth === 'number' &&
                        colLoadingWidth !== 0
                      ) {
                        return (
                          <Table.LoadingTD
                            key={i}
                            width={px(colLoadingWidth)}
                          />
                        );
                      }

                      return <td key={i} />;
                    })}
                  </tr>
                );
              })}
            </tbody>
          ) : (
            <tbody>{children}</tbody>
          )}
        </table>
      </div>
    </div>
  );
}

Table.LoadingTD = function LoadingTD({ children, width }) {
  return (
    <td className={styles['loading-td']}>
      <div style={{ width }} />
    </td>
  );
};
