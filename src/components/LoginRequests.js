import * as React from 'react';

import TimeAgo from 'src/components/TimeAgo';
import graphql from 'src/client/graphql/queries';
import styles from 'styles/LoginRequests.module.css';

export default function LoginRequests() {
  const loginRequests = graphql.loginRequests();

  // console.debug({ loginRequests });

  return (
    <div className={styles.loginRequests}>
      <div className={styles.loginRequestsHeader}>Login Requests</div>
      <div className={styles.loginRequestsTable}>
        <table>
          <thead>
            <tr>
              <td></td>

              <td>Details</td>
            </tr>
          </thead>
          <tbody>
            {loginRequests.map((lr) => {
              return (
                <tr key={lr.id}>
                  <td>
                    {lr.approved ? (
                      '✅'
                    ) : (
                      <TimeAgo date={lr.expires}>
                        {(formattedDate, timeAgoData) => {
                          if (timeAgoData.isPast) {
                            return '❌';
                          }

                          return `⏳`;
                        }}
                      </TimeAgo>
                    )}
                  </td>

                  <td>
                    <TimeAgo date={lr.expires}>
                      {(formattedDate, timeAgoData) => {
                        if (timeAgoData.isPast) {
                          return 'Expired';
                        }

                        return `Expires ${formattedDate}`;
                      }}
                    </TimeAgo>{' '}
                    (
                    <TimeAgo date={lr.created}>
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
