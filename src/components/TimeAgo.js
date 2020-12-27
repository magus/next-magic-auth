import * as React from 'react';
import { FormattedRelativeTime } from 'react-intl';

function getTimeAgoData(date) {
  const now = Date.now();
  const secondsAgo = (date.getTime() - now) / 1000;
  const isPast = secondsAgo < 0;
  const isFuture = secondsAgo > 0;

  return { now, secondsAgo, isPast, isFuture };
}

export default function TimeAgo(props) {
  const date = props.date instanceof Date ? props.date : new Date(props.date);

  return (
    <FormattedRelativeTime
      value={getTimeAgoData(date).secondsAgo}
      numeric="auto"
      style="long"
      updateIntervalInSeconds={1}
    >
      {(formattedDate) => {
        // console.debug('[TimeAgo]', { formattedDate });

        if (typeof props.children === 'function') {
          return props.children(formattedDate, getTimeAgoData(date));
        }

        return formattedDate;
      }}
    </FormattedRelativeTime>
  );
}
