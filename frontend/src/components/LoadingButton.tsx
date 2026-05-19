import React from "react";
import type { ButtonHTMLAttributes } from "react";
import "../styles/LoadingButton.css";

interface LoadingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading: boolean;
  loadingText?: string;
}

const LoadingButton: React.FC<LoadingButtonProps> = ({
  isLoading,
  loadingText = "Attendere...",
  children,
  className = "",
  ...props
}) => {
  return (
    <button
      className={className}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <div className="loading-content">
          <div className="spinner"></div>
          <span>{loadingText}</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
};

export default LoadingButton;
