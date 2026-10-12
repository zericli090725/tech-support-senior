import { Input } from '@/components/ui/input'
import { NativeSelect } from '@/components/ui/native-select'
import { Textarea } from '@/components/ui/textarea'
import { cn } from 'cn'

function FieldLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium">
      {label}
      {children}
    </label>
  )
}

export function TextField({
  label,
  className,
  ...props
}: { label: string } & React.ComponentProps<typeof Input>) {
  return (
    <FieldLabel label={label}>
      <Input className={cn('h-10', className)} {...props} />
    </FieldLabel>
  )
}

export function SelectField({
  label,
  children,
  ...props
}: { label: string; children: React.ReactNode } & React.ComponentProps<typeof NativeSelect>) {
  return (
    <FieldLabel label={label}>
      <NativeSelect {...props}>{children}</NativeSelect>
    </FieldLabel>
  )
}

export function TextareaField({
  label,
  ...props
}: { label: string } & React.ComponentProps<typeof Textarea>) {
  return (
    <FieldLabel label={label}>
      <Textarea {...props} />
    </FieldLabel>
  )
}
