import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import { v4 as uuidv4 } from 'uuid'; // requestId 생성을 위한 uuid

// 앱에서 먼저 요청을 보낼 때 : flutterBridge
// 웹에서 먼저 요청을 보낼 때 : webviewBridge
export default function Home() {
  const { data: session, status } = useSession();
  const [message, setMessage] = useState("");
  const [pendingRequests, setPendingRequests] = useState({});
  
  // State variables to hold app information
  const [appId, setAppId] = useState("");
  const [appName, setAppName] = useState("");
  const [appVersion, setAppVersion] = useState("");

  // Ref to store callbacks associated with requestIds
  const pendingCallbacks = useRef({});

  const popupCenter = (url, title) => {
    const dualScreenLeft = window.screenLeft ?? window.screenX;
    const dualScreenTop = window.screenTop ?? window.screenY;

    const width =
      window.innerWidth ?? document.documentElement.clientWidth ?? screen.width;

    const height =
      window.innerHeight ??
      document.documentElement.clientHeight ??
      screen.height;

    const systemZoom = width / window.screen.availWidth;

    const left = (width - 500) / 2 / systemZoom + dualScreenLeft;
    const top = (height - 550) / 2 / systemZoom + dualScreenTop;

    const newWindow = window.open(
      url,
      title,
      `width=${500 / systemZoom},height=${550 / systemZoom},top=${top},left=${left}`
    );

    newWindow?.focus();
  };

  class WebviewMessage {
    constructor(requestId, action, type, data) {
      this.request_id = requestId;
      this.action = action;
      this.type = type;
      this.data = data;
    }
  }


  useEffect(() => {
    if (typeof window !== 'undefined') {
      // 웹에서 먼저 요청을 보낸 후, 앱의 응답을 받을 때
      window.flutter_inappwebview.webviewBridge = (response) => {
        const { type, action, request_id, data } = response;
        console.log(`Response Received: ${JSON.stringify(response)}`);
        
        if (type === "response" && pendingRequests[request_id]) {
          // 응답에 대한 콜백을 실행합니다.
          if (pendingCallbacks.current[request_id]) {
            pendingCallbacks.current[request_id](data);
            delete pendingCallbacks.current[request_id];
          }

          // pendingRequests 제거
          setPendingRequests((prevRequests) => {
            const newRequests = { ...prevRequests };
            delete newRequests[request_id];
            return newRequests;
          });
        }
      };
      
      // 앱에서 먼저 요청을 보낼 때
      window.flutter_inappwebview.flutterBridge = (request) => {
        const { type, action, request_id, data } = request;
        console.log(`Received Request: ${JSON.stringify(request)}`);
        
        if (type === "request") {
          console.log(`sent : ${JSON.stringify(request)}`);
          // 동일한 requestId로 앱에 응답
          const responseMessage = new WebviewMessage(request_id, action, "response", { status: "logged" });
          window.flutter_inappwebview.callHandler('flutterBridge', responseMessage);
        }
      };
    }
  }, [pendingRequests]);

  // 앱에 먼저 요청을 보낼 때
  const sendFlutterRequest = async (action, data, callback) => {
    if (typeof window !== 'undefined') {
      const requestId = uuidv4(); // 고유한 requestId 생성

      // 응답 대기 중인 요청으로 저장
      setPendingRequests((prevRequests) => ({
        ...prevRequests,
        [requestId]: { action, data },
      }));
      pendingCallbacks.current[requestId] = callback;

      // 앱으로 요청 전송
      console.log(`sent : ${JSON.stringify({ action, data, requestId })}`);
      const message = new WebviewMessage(requestId, action, "request", data);
      window.flutter_inappwebview.callHandler('webviewBridge', message);
    }
  };

  // Cleanup on component unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      pendingCallbacks.current = {};
    };
  }, []);

  if (status === "authenticated") {
    return (
      <div>
        <h2>Welcome {session.user.email} 😀</h2>
        <button onClick={() => signOut()}>Sign out</button>
      </div>
    );
  } else if (status === "unauthenticated") {
    return (
      <div>
        <h2>Please Login</h2>
        <button onClick={() => popupCenter("/google-signin", "Sample Sign In")}>
          Sign In with Google
        </button>
        {/* 이 버튼을 누르면 Flutter로 앱 정보를 요청합니다. */}
        <button onClick={() => sendFlutterRequest('app_info', { }, (responseData) => {
          console.log('App Info Response:', responseData);
          // Set the state variables with the received data
          setAppId(responseData.app_id || "N/A");
          setAppName(responseData.app_name || "N/A");
          setAppVersion(responseData.app_version || "N/A");
        })}>
          Request App Info
        </button>
        
        {/* Display the app information */}
        <div style={{ marginTop: '20px' }}>
          <h3>App Information:</h3>
          <p><strong>App ID:</strong> {appId || "Not Retrieved"}</p>
          <p><strong>App Name:</strong> {appName || "Not Retrieved"}</p>
          <p><strong>App Version:</strong> {appVersion || "Not Retrieved"}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1>Loading...</h1>
    </div>
  );
}
