import * as React from 'react';

export default function useWindowHeight() {
  const [height, set_height] = React.useState(null);

  React.useEffect(() => {
    if (!process.browser) return;

    // function getHeights() {
    //   return {
    //     windowInnerHeight: window.innerHeight,
    //     documentBodyOffsetHeight: document.body.offsetHeight,
    //     pageOffsetHeight: pageRef.current.offsetHeight,
    //   };
    // }

    requestAnimationFrame(() => {
      // requestAnimationFrame(() => {})
      // console.debug(JSON.stringify(getHeights(), null, 2));
      set_height(window.innerHeight);

      // console.debug('page parent heights');
      // let node = pageRef.current;
      // while (node) {
      //   const offsetHeight = node.offsetHeight;
      //   if (offsetHeight === 0) {
      //     node.style.overflow = 'hidden';
      //     node.style.overscrollBehavior = 'contain';
      //   }
      //   console.debug(node.tagName, node.id || node.className, offsetHeight);
      //   node = node.parentElement;
      // }
    });
  }, []);

  return height;
}
