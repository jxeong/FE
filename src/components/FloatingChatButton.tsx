import chatIcon from "../assets/chat.svg";
import "../styles/FloatingChatButton.css";

interface FloatingChatButtonProps {
  onClick: () => void;
}

export function FloatingChatButton({ onClick }: FloatingChatButtonProps) {
  return (
    <button className="floating-chat-button" onClick={onClick}>
      <img src={chatIcon} alt="채팅" />
    </button>
  );
}
