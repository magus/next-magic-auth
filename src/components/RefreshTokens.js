import * as React from 'react';
import gql from 'graphql-tag';
import { useMutation } from '@apollo/client';

import { useAuth } from 'src/components/AuthProvider';
import Button from 'src/components/Button';
import Location from 'src/components/Location';
import Table from 'src/components/Table';
import TimeAgo from 'src/components/TimeAgo';

import headers from 'src/shared/headers';
import roles from 'src/shared/roles';

export default function RefreshTokens({ loading, refreshTokens }) {
  const auth = useAuth();
  const [deletingSessions, set_deletingSessions] = React.useState({});

  const header = `Active sessions${
    loading ? '' : ` (${refreshTokens.length})`
  }`;
  const columns = ['', 'Device', 'Location', 'IP', 'Last active', 'Details'];
  const loadingWidths = [0, 200, 100, 100, 200];

  // mark session as 'deleting'
  async function handleDeleteSession(id) {
    set_deletingSessions({ ...deletingSessions, [id]: true });
  }
  // unmark session as 'deleting'
  async function handleDeleteSessionError(id) {
    const new_deletingSessions = { ...deletingSessions };
    delete new_deletingSessions[id];
    set_deletingSessions(new_deletingSessions);
  }

  return (
    <Table {...{ header, columns, loading, loadingWidths }}>
      {refreshTokens.map((rt) => {
        return (
          <tr key={rt.id}>
            <td>
              {auth.loginRequestId === rt.id ? (
                '🎉'
              ) : (
                <DeleteSession
                  id={rt.id}
                  onDelete={handleDeleteSession}
                  onError={handleDeleteSessionError}
                />
              )}
            </td>

            {deletingSessions[rt.id] ? (
              <td colSpan={`${columns.length - 1}`}>Logging out session...</td>
            ) : (
              <React.Fragment>
                <td>{rt.userAgent}</td>

                <td>
                  <Location rowWithGeo={rt} />
                </td>

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
              </React.Fragment>
            )}
          </tr>
        );
      })}
    </Table>
  );
}

function DeleteSession({ id, onDelete, onError }) {
  const [deleteSession, { data, loading, error }] = useMutation(
    deleteLoginToken,
    {
      variables: { id },
      context: {
        headers: {
          [headers.role]: roles.self,
        },
      },
    },
  );

  React.useEffect(() => {
    if (error) {
      onError(id);
    }
  }, [error]);

  async function handleDeleteSession() {
    onDelete(id);
    deleteSession();
    // // simulate error
    // setTimeout(() => {
    //   onError(id);
    // }, 2000);
  }

  const title = loading ? 'Logout this session' : 'Logging out session';

  return (
    <Button simple title={title} onClick={handleDeleteSession}>
      {loading ? '⏳' : '❌'}
    </Button>
  );
}

const deleteLoginToken = gql`
  mutation DeleteLoginToken($id: uuid!) {
    delete_loginToken_by_pk(id: $id) {
      id
    }
  }
`;
