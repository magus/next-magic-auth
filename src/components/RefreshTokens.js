import * as React from 'react';

import { useAuth } from 'src/components/AuthProvider';

import Table from 'src/components/Table';
import TimeAgo from 'src/components/TimeAgo';
import graphql from 'src/client/graphql/queries';

export default function RefreshTokens({ loading, refreshTokens }) {
  const auth = useAuth();

  const header = `Active sessions${
    loading ? '' : ` (${refreshTokens.length})`
  }`;
  const columns = ['', 'Device', 'IP', 'Last active', 'Details'];
  const loadingWidths = [0, 200, 100, 100, 200];

  return (
    <Table {...{ header, columns, loading, loadingWidths }}>
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
    </Table>
  );
}
