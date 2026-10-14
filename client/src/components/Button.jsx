import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

function Button({
  children,
  to,
  variant = "primary",
  type = "button",
  onClick,
  className = "",
  icon = true,
  ...props
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-slate-950";

  const variants = {
    primary:
      "bg-green-500 text-slate-950 hover:bg-green-400 hover:-translate-y-0.5",
    secondary:
      "border border-slate-300 bg-white text-slate-900 hover:border-blue-500 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:border-blue-400",
    dark:
      "bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950",
    ghost:
      "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800",
  };

  const classes = `${base} ${variants[variant] || variants.primary} ${className}`;

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {children}
        {icon && <ArrowRight size={17} />}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} className={classes} {...props}>
      {children}
      {icon && <ArrowRight size={17} />}
    </button>
  );
}

export default Button;