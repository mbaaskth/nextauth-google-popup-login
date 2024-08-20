import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from 'uuid'; // requestId 생성을 위한 uuid

export default function Home() {
  const { data: session, status } = useSession();
  const [message, setMessage] = useState("");
  const [pendingRequests, setPendingRequests] = useState({});

  // 플러터에 메시지를 보내는 함수
  const sendFlutterRequest = (action, data) => {
    const requestId = uuidv4(); // 고유한 requestId 생성

    // Flutter로 메시지 전송
    window.flutterBridge({
      requestId: requestId,
      action: action,
      type: "request",
      data: data,
    });

    // 응답 대기 중인 요청으로 저장
    setPendingRequests((prevRequests) => ({
      ...prevRequests,
      [requestId]: { action, data },
    }));

    console.log(`Request sent: ${requestId}, action: ${action}, data: ${JSON.stringify(data)}`);
  };

  // 플러터로부터 메시지를 받을 때 처리하는 함수
  const handleFlutterMessage = (event) => {
    const message = event.data;

    if (message.type === "response" && pendingRequests[message.requestId]) {
      console.log(`Response received: ${JSON.stringify(message)}`);

      // 응답 후 pendingRequests에서 제거
      setPendingRequests((prevRequests) => {
        const newRequests = { ...prevRequests };
        delete newRequests[message.requestId];
        return newRequests;
      });
    } else if (message.type === "request" && message.action === "log") {
      console.log(`Log action received from Flutter: ${JSON.stringify(message.data)}`);
      
      // 동일한 requestId로 Flutter에 응답 전송 (콜백)
      window.flutterBridge({
        requestId: message.requestId,
        action: "logResponse",
        type: "response",
        data: { status: "logged" },
      });

      console.log(`Callback sent: ${message.requestId}, action: logResponse`);
    }
  };

  // 플러터 메시지 핸들러 등록
  useEffect(() => {
    window.addEventListener("message", handleFlutterMessage);

    return () => {
      window.removeEventListener("message", handleFlutterMessage);
    };
  }, [pendingRequests]);

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
