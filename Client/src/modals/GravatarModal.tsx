import React from 'react';

interface GravatarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const gravatarLink =
  'https://wordpress.com/log-in/link?client_id=1854&redirect_to=https%3A%2F%2Fpublic-api.wordpress.com%2Foauth2%2Fauthorize%3Fclient_id%3D1854%26response_type%3Dcode%26blog_id%3D0%26state%3D5a6405af107423f72b2a15f84382dda31954b049b870ed9dcb4ebb6ccc15cc5f%26redirect_uri%3Dhttps%253A%252F%252Fgravatar.com%252Fconnect%252F%253Faction%253Drequest_access_token%26gravatar_from%3Dsignup%26from-calypso%3D1&gravatar_from=signup';

export default function GravatarModal({ isOpen, onClose }: Readonly<GravatarModalProps>): React.ReactElement | null {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-[var(--theme-surface)] text-[var(--theme-text)] p-6 rounded-xl max-w-sm w-full shadow-[0_0_25px_2px_var(--theme-shadow)] relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-[var(--theme-border-red)] text-xl font-bold hover:text-red-700 focus:outline-none"
          aria-label="Close"
        >
          &times;
        </button>

        <h2 className="text-lg font-bold mb-4 text-center">Update Your Gravatar</h2>
        <p className="text-sm mb-4">
          Your avatar is powered by Gravatar. To change it, you'll need to register or log in with the email associated with your account.
        </p>
        <a
          href={gravatarLink}
          target="_blank"
          rel="noopener noreferrer"
          className="block center px-4 py-2 text-sm rounded bg-[var(--theme-button)] hover:bg-[var(--theme-hover)] text-center text-[var(--theme-text-white)] shadow focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/60"
        >
          Open Gravatar
        </a>
      </div>
    </div>
  );
}
