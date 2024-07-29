import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState } from "react";

export default function Home() {
  const { data: session, status } = useSession();
  const [message, setMessage] = useState("");

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
      `width=${500 / systemZoom},height=${550 / systemZoom
      },top=${top},left=${left}`
    );

    newWindow?.focus();
  };

  useEffect(() => {
    if (status === "authenticated" && session) {
      // 웹뷰로 메시지 보내기
      if (window.flutter_inappwebview) {
        window.flutter_inappwebview.callHandler('FlutterJSChannel', `hello ${session.user.email}!`);
      } else if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(`hello ${session.user.email}!`);
      }
    }
  }, [status, session]);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data.startsWith("hello Web")) {
        setMessage(event.data); // 메시지를 상태에 저장
      }
    };

    window.addEventListener("message", handleMessage);

    // 클린업 함수로 이벤트 리스너 제거
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  if (status === "authenticated") {
    return (
      <div>
        <h2>Welcome {session.user.email} 😀</h2>
        <button onClick={() => signOut()}>Sign out</button>
        {message && <p>{message}</p>} {/* 메시지를 화면에 표시 */}
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
