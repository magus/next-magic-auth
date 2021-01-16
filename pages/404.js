import Error from 'next/error';

Page.disableAuth = true;
Page.title = 'Not Found';

export default function Page({ errorCode, stars }) {
  return <Error statusCode={404} />;
}
