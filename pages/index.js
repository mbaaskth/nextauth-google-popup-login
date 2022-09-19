
import { useSession, signIn, signOut } from "next-auth/react";

export default function Home() {
  const { data: session, status } = useSession();

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

  if (status === "authenticated") {
    <h2>Welcome {session.user.email} 😀</h2>

  }
  else if (status === "unauthenticated") {
    <div>

      <h2>Please Login</h2>
      <button onClick={() => popupCenter("/auth/sign_in", "Sample Sign In")} >
        Sign In with Google
      </button>
    </div>
  }

  return (
    <div>

    </div>
  )
}
