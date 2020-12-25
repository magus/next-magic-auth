export default function loginConfirmEmail({ email, loginConfirmUrl, phrase }) {
  return `
  <html>
    <head>
      <meta http-equiv="Content-Type" content="text/html charset=UTF-8" />
    </head>
    <body>
      <style>

  :root {
    --main-color: 249, 109, 16;
    --secondary-color: 35, 181, 211;
    --white: 255, 255, 255;
    --black: 26, 9, 13;
    --dark-blue: 9, 4, 70;

    --font-small: 14px;
    --font-normal: 16px;
    --font-large: 20px;

    --spacer: 8px;
    --spacer-2: -moz-calc(var(--spacer) * 2);
    --spacer-2: calc(var(--spacer) * 2);
    --spacer-3: -moz-calc(var(--spacer) * 3);
    --spacer-3: calc(var(--spacer) * 3);
    --spacer-4: -moz-calc(var(--spacer) * 4);
    --spacer-4: calc(var(--spacer) * 4);
    --spacer-5: -moz-calc(var(--spacer) * 5);
    --spacer-5: calc(var(--spacer) * 5);
    --spacer-6: -moz-calc(var(--spacer) * 6);
    --spacer-6: calc(var(--spacer) * 6);
  }

  html,
  body {
    padding: 0;
    margin: 0;
    color: rgba(var(--black), 1.0);
    font-size: 16px;
    font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen,
      Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  * {
    -moz-box-sizing: border-box;
         box-sizing: border-box;

    /*Reset's every elements apperance*/
    background: none repeat scroll 0 0 transparent;
    border: medium none;
    border-spacing: 0;
    list-style: none outside none;
    margin: 0;
    padding: 0;
    text-align: left;
    text-decoration: none;
    text-indent: 0;
    color: rgba(var(--black), 1.0);
    font-size: 16px;
    font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen,
      Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
    font-weight: normal;
    line-height: 1.42rem;
  }

  html,
  body,
  #__next {
    height: 100%;
  }

  .Button_button__1rPei {
    --button-height: var(--spacer-6);

    width: 100%;
    height: var(--button-height);
    -moz-border-radius: var(--spacer);
         border-radius: var(--spacer);
    background-color: rgba(var(--main-color), 1.0);
    display: -webkit-flex;
    display: -moz-box;
    display: flex;
    -webkit-justify-content: center;
       -moz-box-pack: center;
            justify-content: center;
    line-height: var(--button-height);
    color: rgba(var(--white), 0.9);
    font-weight: 700;
  }

  .email_container__24Nn- {
    max-width: 450px;
    text-align: left;
  }

  .email_email__3AZYW {
    font-weight: 800;
  }

  .email_paragraph__1JNat {
    display: inline-block;
    margin: var(--spacer-2) 0;
  }
      </style>
      <table class="email_container__24Nn-" cellpadding="0" cellspacing="0" border="0"><tbody><tr><td><span class="email_paragraph__1JNat">Click the magic words below to login as<!-- --> <b class="email_email__3AZYW">${email}</b>.<br>The magic words will only work for the next 2 hours.</span></td></tr><tr><td><a href="${loginConfirmUrl}" style=""><button class="Button_button__1rPei">${phrase}</button></a></td></tr><tr><td><span class="email_paragraph__1JNat">Ensure the magic words match what you saw on the login page.</span></td></tr></tbody></table>
    </body>
  </html>
  `;
}
