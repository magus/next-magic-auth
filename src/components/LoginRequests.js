import * as React from 'react';

import Table from 'src/components/Table';
import TimeAgo from 'src/components/TimeAgo';
import graphql from 'src/client/graphql/queries';

export default function LoginRequests({ loading, loginRequests }) {
  const header = `Login requests${loading ? '' : ` (${loginRequests.length})`}`;
  const columns = ['', 'Device', 'IP', 'Details'];
  const loadingWidths = [0, 200, 100, 200];

  return (
    <Table {...{ header, columns, loading, loadingWidths }}>
      {loginRequests.map((lr) => {
        return (
          <tr key={lr.id}>
            <td>
              <TimeAgo date={lr.expires}>
                {(formattedDate, timeAgoData) => {
                  if (timeAgoData.isPast) {
                    return '❌';
                  } else if (lr.approved) {
                    return '✅';
                  }

                  return `⏳`;
                }}
              </TimeAgo>
            </td>

            <td>{lr.userAgent}</td>

            <td>{lr.ip}</td>

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
    </Table>
  );
}
