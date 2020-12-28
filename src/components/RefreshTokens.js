import * as React from 'react';

import { useAuth } from 'src/components/AuthProvider';

import TimeAgo from 'src/components/TimeAgo';
import graphql from 'src/client/graphql/queries';
import styles from 'styles/RefreshTokens.module.css';

export default function RefreshTokens() {
  const auth = useAuth();
  const refreshTokens = graphql.watchRefreshTokens();

  // console.debug({ refreshTokens });

  return (
    <div className={styles.refreshTokens}>
      <div className={styles.refreshTokensHeader}>Active sessions</div>
      <div className={styles.refreshTokensTable}>
        <table>
          <thead>
            <tr>
              <td></td>

              <td>Device</td>

              <td>IP</td>

              <td>Last Active</td>

              <td>Details</td>
            </tr>
          </thead>
          <tbody>
            {refreshTokens.map((rt) => {
              return (
                <tr key={rt.id}>
                  <td>{auth.loginRequestId === rt.id ? '🎉' : ' '}</td>

                  <td>{rt.userAgent}</td>

                  <td>{rt.ip}</td>

                  <td>
                    <TimeAgo date={rt.lastActive} />
                  </td>

                  <td>
                    <TimeAgo date={rt.created}>
                      {(formattedDate, timeAgoData) => {
                        return `Created ${formattedDate}`;
                      }}
                    </TimeAgo>
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
