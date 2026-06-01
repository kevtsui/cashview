/* global React, ReactDOM, DirectionB */
/* Finalized entry — Command Center, light mode only. */
(function () {
  const { useEffect } = React;
  function FinalApp() {
    useEffect(() => { document.documentElement.setAttribute('data-theme', 'light'); }, []);
    return <div style={{ height: '100vh', overflow: 'hidden' }}><DirectionB /></div>;
  }
  ReactDOM.createRoot(document.getElementById('root')).render(<FinalApp />);
})();
