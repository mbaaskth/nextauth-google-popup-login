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
    // JavaScript 코드 삽입 테스트
    const script = document.createElement("script");
    script.innerHTML = `
      setTimeout(() => {
        console.log("Sending message: hello world! please login.");
        if (typeof FlutterJSChannel !== "undefined") {
          FlutterJSChannel.postMessage('hello world! please login.');
        }

        if ('${status}' === "authenticated" && ${session ? true : false}) {
          console.log('Sending message: hello ${session?.user?.email}!');
          if (typeof FlutterJSChannel !== "undefined") {
            FlutterJSChannel.postMessage('hello ${session?.user?.email}!');
          }
        } else {
          console.log('Hello. Please Login.');
          if (typeof FlutterJSChannel !== "undefined") {
            FlutterJSChannel.postMessage('Hello. Please Login.');
          }
        }
      }, 1000);
    `;
    document.body.appendChild(script);

    // 클린업 함수
    return () => {
      document.body.removeChild(script);
    };
  }, [status, session]);


  useEffect(() => {
    console.log("useEffect executed"); // 확인용 로그
    // 1초 대기 후 메시지 보내기
    setTimeout(() => {
      console.log("Sending message: hello world! please login.");
      FlutterJSChannel.postMessage(`hello world! please login.`);
    }, 1000);
    if (status === "authenticated" && session) {
      console.log(`Sending message: hello ${session.user.email}!`);
      FlutterJSChannel.postMessage(`hello ${session.user.email}!`);
    } else {
      console.log(`Hello. Please Login.`);
      FlutterJSChannel.postMessage(`Hello. Please Login.`);
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
