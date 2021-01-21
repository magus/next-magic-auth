import * as React from 'react';

import DeleteSession from 'src/components/DeleteSession';
import Location from 'src/components/Location';
import Table from 'src/components/Table';
import TimeAgo from 'src/components/TimeAgo';

export default function LoginRequests({ loading, loginRequests }) {
  const [deletingSessions, set_deletingSessions] = React.useState({});

  const header = `Login requests${loading ? '' : ` (${loginRequests.length})`}`;
  const columns = ['', 'Device', 'Location', 'Details', 'Domain'];
  const loadingWidths = [32, 150, 250, 150, 100];

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

  if (loginRequests.length === 0) {
    return null;
  }

  return (
    <Table {...{ header, columns, loading, loadingWidths }}>
      {loginRequests.map((lr) => {
        return (
          <tr key={lr.id}>
            <Table.IconColumn>
              <DeleteSession
                id={lr.id}
                onDelete={handleDeleteSession}
                onError={handleDeleteSessionError}
                buttonTitleDeleting="Deleting login request"
                buttonTitle="Delete this login request"
              />
            </Table.IconColumn>

            {deletingSessions[lr.id] ? (
              <td colSpan={`${columns.length - 1}`}>Deleting login request...</td>
            ) : (
              <React.Fragment>
                <td>{lr.userAgent}</td>

                <td>
                  <Location rowWithGeo={lr} /> ({lr.ip})
                </td>

                <td>
                  <TimeAgo date={lr.expires}>
                    {(formattedDate, timeAgoData) => {
                      if (timeAgoData.isPast) {
                        return (
                          <TimeAgo simpledate date={lr.expires}>
                            {(formattedDate, timeAgoData) => {
                              return `❌  Expired (${formattedDate})`;
                            }}
                          </TimeAgo>
                        );
                      } else if (lr.approved) {
                        return (
                          <TimeAgo date={lr.created}>
                            {(formattedDate, timeAgoData) => {
                              return '✅  Approved';
                            }}
                          </TimeAgo>
                        );
                      }

                      return `⏳  Expires ${formattedDate}`;
                    }}
                  </TimeAgo>
                </td>

                <td>{lr.domain || 'Unknown'}</td>
              </React.Fragment>
            )}
          </tr>
        );
      })}
    </Table>
  );
}
