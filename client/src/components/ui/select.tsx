import * as React from 'react';
import { ChevronDown } from 'lucide-react';

import { cn } from '@/lib/utils';

type SelectContextType = {
  value?: string;
  onValueChange?: (value: string) => void;
};

const SelectContext = React.createContext<SelectContextType>({});

function Select({
  value,
  onValueChange,
  children,
}: {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <SelectContext.Provider value={{ value, onValueChange }}>
      <div className="relative">{children}</div>
    </SelectContext.Provider>
  );
}

function SelectTrigger({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'relative flex h-9 w-full items-center rounded-md border border-input bg-background text-foreground',
        className
      )}
    >
      {children}

      <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 opacity-50" />
    </div>
  );
}

function SelectValue({ placeholder }: { placeholder?: string }) {
  const { value } = React.useContext(SelectContext);

  return (
    <span className="px-3 text-sm text-foreground capitalize">
      {value || placeholder}
    </span>
  );
}

function SelectContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { value, onValueChange } = React.useContext(SelectContext);

  const options: React.ReactElement[] = [];

  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child)) {
      options.push(child);
    }
  });

  return (
    <select
      value={value}
      onChange={(e) => onValueChange?.(e.target.value)}
      className={cn(
        `
        absolute inset-0
        h-full w-full
        cursor-pointer
        opacity-0
        text-black
        bg-white
        `,
        className
      )}
    >
      {options}
    </select>
  );
}

function SelectItem({
  value,
  children,
}: {
  value: string;
  children: React.ReactNode;
}) {
  return (
    <option
      value={value}
      className="bg-white text-black dark:bg-zinc-900 dark:text-white"
    >
      {children}
    </option>
  );
}

const SelectGroup = ({ children }: { children: React.ReactNode }) => (
  <>{children}</>
);

const SelectLabel = ({ children }: { children: React.ReactNode }) => (
  <>{children}</>
);

const SelectSeparator = () => null;
const SelectScrollUpButton = () => null;
const SelectScrollDownButton = () => null;

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
};
