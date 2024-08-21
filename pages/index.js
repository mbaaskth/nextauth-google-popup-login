import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from 'uuid'; // requestId 생성을 위한 uuid

export default function Home() {
  const { data: session, status } = useSession();
  const [message, setMessage] = useState("");
  const [pendingRequests, setPendingRequests] = useState({});

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
      this.requestId = requestId;
      this.action = action;
      this.type = type;
      this.data = data;
    }
  }

  // 클라이언트 측에서만 실행되는 코드를 위한 useEffect
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener("flutterInAppWebViewPlatformReady", function(event) {
        console.log("Flutter Webview is ready.");
        
        // 웹에서 먼저 요청을 보낸 후 응답을 받을 때 webviewBridge
        window.flutter_inappwebview.callHandler('webviewBridge')
          .then(function(result) {
            console.log("Data received from Flutter: ", result);
            alert(result); // 앱에서 받은 데이터를 alert로 표시
          });
        // 앱에서 먼저 요청을 보낼 때 flutterBridge
        window.flutter_inappwebview.callHandler('flutterBridge')
          .then((message) => {
            const { requestId, action, type, data } = message;

            if (type === "request" && action === "log") {
              console.log(`Received from Flutter: ${JSON.stringify(message)}`);

              const responseMessage = new WebviewMessage(requestId, "log", "response", { status: "logged" });
              // 동일한 requestId로 Flutter에 응답
              window.flutter_inappwebview.callHandler('webviewBridge', responseMessage);
            }
          });
      });
    }
  }, []);

  // 플러터에 메시지를 보내는 함수
  const sendFlutterRequest = async (action, data) => {
    if (typeof window !== 'undefined') {
      const requestId = uuidv4(); // 고유한 requestId 생성

      // 응답 대기 중인 요청으로 저장
      setPendingRequests((prevRequests) => ({
        ...prevRequests,
        [requestId]: { action, data },
      }));

      console.log(`Request sent: ${requestId}, action: ${action}, data: ${JSON.stringify(data)}`);

      const message = new WebviewMessage(requestId, action, "request", data);
      // 플러터로 메시지 전송 및 응답 대기
      const response = await window.flutter_inappwebview.callHandler('webviewBridge', message);

      // 플러터에서 반환된 응답 처리
      handleFlutterResponse(response);
    }
  };

  // 플러터에서 받은 응답을 처리하는 함수
  const handleFlutterResponse = (response) => {
    const { requestId, action, type, data } = response;

    if (type === "response" && pendingRequests[requestId]) {
      console.log(`Response received: ${JSON.stringify(response)}`);

      // 응답 후 pendingRequests에서 제거
      setPendingRequests((prevRequests) => {
        const newRequests = { ...prevRequests };
        delete newRequests[requestId];
        return newRequests;
      });
    }
  };

  if (status === "authenticated") {
    return (
      <div>
        <h2>Welcome {session.user.email} 😀</h2>
        <button onClick={() => signOut()}>Sign out</button>
        {message && <p>{message}</p>} {/* 메시지를 화면에 표시 */}
        
        {/* 이 버튼을 누르면 Flutter로 메시지를 보냅니다 */}
        <button onClick={() => sendFlutterRequest('log', { message: 'Hello from Next.js' })}>
          Send Log to Flutter
        </button>
      </div>
    );
  } else if (status === "unauthenticated") {
    return (
      <div>
        <h2>Please Login</h2>
        <button onClick={() => popupCenter("/google-signin", "Sample Sign In")}>
          Sign In with Google
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1>Loading...</h1>
    </div>
  );
}
