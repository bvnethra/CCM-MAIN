import React, { useState } from 'react';
import { Eye, EyeOff, Upload, AlertCircle } from 'lucide-react';

interface BaseInputProps {
  label: string;
  name?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  className?: string;
}

export const TextInput: React.FC<
  BaseInputProps & React.InputHTMLAttributes<HTMLInputElement> & { leftIcon?: React.ReactNode }
> = ({ label, required, error, helperText, disabled, className = '', leftIcon, ...props }) => {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className="text-xs font-semibold text-slate-700">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <div className="relative flex items-center">
        {leftIcon && <div className="absolute left-3.5 text-slate-400 pointer-events-none">{leftIcon}</div>}
        <input
          disabled={disabled}
          {...props}
          className={`w-full py-2 text-sm bg-white border rounded-xl transition-all placeholder:text-slate-400 text-slate-800 disabled:bg-slate-50 disabled:text-slate-400 shadow-2xs ${
            leftIcon ? 'pl-10 pr-3.5' : 'px-3.5'
          } ${
            error
              ? 'border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200'
              : 'border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20'
          }`}
        />
      </div>
      {error && (
        <span className="inline-flex items-center gap-1 text-[11px] text-rose-600 font-medium">
          <AlertCircle className="w-3 h-3 shrink-0" />
          {error}
        </span>
      )}
      {helperText && !error && <span className="text-[11px] text-slate-400">{helperText}</span>}
    </div>
  );
};

export const NumberInput: React.FC<
  BaseInputProps & React.InputHTMLAttributes<HTMLInputElement> & { leftIcon?: React.ReactNode }
> = ({ label, required, error, helperText, disabled, className = '', leftIcon, ...props }) => {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className="text-xs font-semibold text-slate-700">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <div className="relative flex items-center">
        {leftIcon && <div className="absolute left-3.5 text-slate-400 pointer-events-none">{leftIcon}</div>}
        <input
          type="number"
          disabled={disabled}
          {...props}
          className={`w-full py-2 text-sm bg-white border rounded-xl transition-all placeholder:text-slate-400 text-slate-800 disabled:bg-slate-50 disabled:text-slate-400 shadow-2xs ${
            leftIcon ? 'pl-10 pr-3.5' : 'px-3.5'
          } ${
            error
              ? 'border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200'
              : 'border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20'
          }`}
        />
      </div>
      {error && (
        <span className="inline-flex items-center gap-1 text-[11px] text-rose-600 font-medium">
          <AlertCircle className="w-3 h-3 shrink-0" />
          {error}
        </span>
      )}
      {helperText && !error && <span className="text-[11px] text-slate-400">{helperText}</span>}
    </div>
  );
};

export const PasswordInput: React.FC<
  BaseInputProps & React.InputHTMLAttributes<HTMLInputElement>
> = ({ label, required, error, helperText, disabled, className = '', ...props }) => {
  const [show, setShow] = useState(false);

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className="text-xs font-semibold text-slate-700">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <div className="relative flex items-center">
        <input
          type={show ? 'text' : 'password'}
          disabled={disabled}
          {...props}
          className={`w-full py-2 pl-3.5 pr-10 text-sm bg-white border rounded-xl transition-all placeholder:text-slate-400 text-slate-800 disabled:bg-slate-50 disabled:text-slate-400 shadow-2xs ${
            error
              ? 'border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200'
              : 'border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20'
          }`}
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {error && (
        <span className="inline-flex items-center gap-1 text-[11px] text-rose-600 font-medium">
          <AlertCircle className="w-3 h-3 shrink-0" />
          {error}
        </span>
      )}
      {helperText && !error && <span className="text-[11px] text-slate-400">{helperText}</span>}
    </div>
  );
};

export const SelectInput: React.FC<
  BaseInputProps &
    React.SelectHTMLAttributes<HTMLSelectElement> & {
      options: { value: string; label: string }[];
    }
> = ({ label, required, error, helperText, disabled, options, className = '', ...props }) => {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className="text-xs font-semibold text-slate-700">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <select
        disabled={disabled}
        {...props}
        className={`w-full py-2 px-3.5 text-sm bg-white border rounded-xl transition-all text-slate-800 disabled:bg-slate-50 disabled:text-slate-400 shadow-2xs ${
          error
            ? 'border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200'
            : 'border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20'
        }`}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <span className="inline-flex items-center gap-1 text-[11px] text-rose-600 font-medium">
          <AlertCircle className="w-3 h-3 shrink-0" />
          {error}
        </span>
      )}
      {helperText && !error && <span className="text-[11px] text-slate-400">{helperText}</span>}
    </div>
  );
};

export const Textarea: React.FC<
  BaseInputProps & React.TextareaHTMLAttributes<HTMLTextAreaElement>
> = ({ label, required, error, helperText, disabled, className = '', ...props }) => {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className="text-xs font-semibold text-slate-700">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <textarea
        disabled={disabled}
        rows={props.rows || 3}
        {...props}
        className={`w-full py-2 px-3.5 text-sm bg-white border rounded-xl transition-all placeholder:text-slate-400 text-slate-800 disabled:bg-slate-50 disabled:text-slate-400 shadow-2xs ${
          error
            ? 'border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200'
            : 'border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20'
        }`}
      />
      {error && (
        <span className="inline-flex items-center gap-1 text-[11px] text-rose-600 font-medium">
          <AlertCircle className="w-3 h-3 shrink-0" />
          {error}
        </span>
      )}
      {helperText && !error && <span className="text-[11px] text-slate-400">{helperText}</span>}
    </div>
  );
};

export const FileUpload: React.FC<{
  label: string;
  required?: boolean;
  onFileSelect?: (file: File) => void;
  fileName?: string;
  accept?: string;
  helperText?: string;
}> = ({ label, required, onFileSelect, fileName, accept = '.pdf,.png,.jpg,.jpeg', helperText }) => {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-700">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <label className="border-2 border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:border-sky-400 hover:bg-sky-50/20 cursor-pointer transition-colors group">
        <Upload className="w-5 h-5 text-sky-600 group-hover:scale-110 transition-transform" />
        <span className="text-xs text-slate-600 font-medium">
          {fileName ? (
            <span className="text-sky-600 font-semibold">{fileName}</span>
          ) : (
            <>Click to browse or drag file here</>
          )}
        </span>
        <span className="text-[10px] text-slate-400">PDF, JPG, PNG up to 10MB</span>
        <input
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0] && onFileSelect) {
              onFileSelect(e.target.files[0]);
            }
          }}
        />
      </label>
      {helperText && <span className="text-[11px] text-slate-400">{helperText}</span>}
    </div>
  );
};

export const Checkbox: React.FC<{
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
  disabled?: boolean;
}> = ({ label, checked, onChange, description, disabled }) => {
  return (
    <label className={`flex items-start gap-2.5 select-none cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500 w-4 h-4 cursor-pointer"
      />
      <div>
        <span className="text-xs font-semibold text-slate-800">{label}</span>
        {description && <p className="text-[11px] text-slate-500">{description}</p>}
      </div>
    </label>
  );
};
