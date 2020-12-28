import * as React from 'react';

import Table from 'src/components/Table';
import TimeAgo from 'src/components/TimeAgo';
import graphql from 'src/client/graphql/queries';

export default function LoginRequests({ loginRequests }) {
  return (
    <Table header="Login requests">
      <table>
        <thead>
          <tr>
            <td></td>

            <td>Device</td>

            <td>IP</td>

            <td>Details</td>
          </tr>
        </thead>
        <tbody>
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
        </tbody>
      </table>
    </Table>
  );
}
