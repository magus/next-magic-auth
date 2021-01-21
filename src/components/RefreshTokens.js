import * as React from 'react';
import Image from 'next/image';

import { useAuth } from 'src/components/AuthProvider';
import DeleteSession from 'src/components/DeleteSession';
import Location from 'src/components/Location';
import Table from 'src/components/Table';
import TimeAgo from 'src/components/TimeAgo';

import styles from 'styles/RefreshTokens.module.css';

export default function RefreshTokens({ loading, refreshTokens }) {
  const auth = useAuth();
  const [deletingSessions, set_deletingSessions] = React.useState({});

  const header = `Active sessions${loading ? '' : ` (${refreshTokens.length})`}`;
  const columns = ['', 'Device', 'Location', 'Last activity', 'Domain'];
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

  return (
    <React.Fragment>
      <Table {...{ header, columns, loading, loadingWidths }}>
        {refreshTokens.map((rt) => {
          return (
            <tr key={rt.id}>
              <Table.IconColumn>
                {auth.loginRequestId === rt.id ? (
                  <div className={Table.styles.flexCenter}>
                    <Image
                      layout="fixed"
                      src="/wand.png"
                      alt="magic wand"
                      title="Current session"
                      width={32}
                      height={32}
                    />
                  </div>
                ) : (
                  <DeleteSession
                    id={rt.id}
                    onDelete={handleDeleteSession}
                    onError={handleDeleteSessionError}
                    buttonTitleDeleting="Logging out session"
                    buttonTitle="Logout this session"
                  />
                )}
              </Table.IconColumn>

              {deletingSessions[rt.id] ? (
                <td colSpan={`${columns.length - 1}`}>Logging out session...</td>
              ) : (
                <React.Fragment>
                  <td>{rt.userAgent}</td>

                  <td>
                    <Location rowWithGeo={rt} /> ({rt.ip})
                  </td>

                  <td>
                    <TimeAgo simpledate date={rt.lastActive} /> (
                    <TimeAgo date={rt.lastActive} />)
                  </td>

                  <td>{rt.loginToken.domain || 'Unknown'}</td>
                </React.Fragment>
              )}
            </tr>
          );
        })}
      </Table>

      {/* <div className={styles.legend}>
        <div className={styles.legendImageSpacer}>
          <Image
            layout="fixed"
            src="/wand.png"
            alt="magic wand"
            width={32}
            height={32}
          />
        </div>
        <span>indicates the current session</span>
      </div> */}
    </React.Fragment>
  );
}
