import * as React from 'react';

import TimeAgo from 'src/components/TimeAgo';
import graphql from 'src/client/graphql/queries';
import styles from 'styles/RefreshTokens.module.css';

export default function RefreshTokens() {
  const refreshTokens = graphql.watchRefreshTokens();

  // console.debug({ refreshTokens });

  return (
    <div className={styles.refreshTokens}>
      <div className={styles.refreshTokensHeader}>Sessions</div>
      <div className={styles.refreshTokensTable}>
        <table>
          <thead>
            <tr>
              <td></td>

              <td>Details</td>
            </tr>
          </thead>
          <tbody>
            {refreshTokens.map((rt) => {
              return (
                <tr key={rt.id}>
                  <td>✅</td>

                  <td>
                    <TimeAgo date={rt.expires}>
                      {(formattedDate, timeAgoData) => {
                        if (timeAgoData.isPast) {
                          return 'Expired';
                        }

                        return `Expires ${formattedDate}`;
                      }}
                    </TimeAgo>{' '}
                    (
                    <TimeAgo date={rt.created}>
                      {(formattedDate, timeAgoData) => {
                        return `Created ${formattedDate}`;
                      }}
                    </TimeAgo>
                    )
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
