import { deleteMedia, updateMedia, uploadMedia } from '@/app/(frontend)/actions/staff'
import { ConfirmButton } from '@/app/(frontend)/staff/components/ConfirmButton'
import { ListFilters, Pager } from '@/app/(frontend)/staff/components/ListControls'
import { TextField } from '@/app/(frontend)/staff/components/fields'
import { StaffForm } from '@/app/(frontend)/staff/components/StaffForm'
import { PAGE_SIZE, readPage, readParam, searchWhere } from '@/app/(frontend)/staff/queries'
import { requireStaff } from '@/lib/auth'
import { formatBytes } from '@/lib/format'

type Props = {
  searchParams: Promise<{ q?: string; page?: string }>
}

export default async function StaffMediaPage({ searchParams }: Props) {
  const { user, payload } = await requireStaff()
  const params = await searchParams
  const q = readParam(params.q)
  const page = readPage(params.page)

  const media = await payload.find({
    collection: 'media',
    where: searchWhere(['alt', 'filename'], q),
    sort: '-createdAt',
    depth: 0,
    page,
    limit: PAGE_SIZE,
    user,
    overrideAccess: false,
  })

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1>Media</h1>
        <p className="text-muted-foreground">Upload files and keep alt text on each one. {media.totalDocs} files.</p>
      </div>
      <article className="flex flex-col gap-3 rounded-xl bg-card p-4 text-sm ring-1 ring-foreground/10">
        <h2>Upload</h2>
        <StaffForm action={uploadMedia} submitLabel="Upload file">
          <TextField label="Alt text" name="alt" required />
          <TextField label="File" name="file" type="file" required />
        </StaffForm>
      </article>
      <ListFilters query={q} placeholder="Alt text or filename" />
      {media.docs.length === 0 ? (
        <p className="text-muted-foreground">{q ? 'Nothing matches that search.' : 'No files yet.'}</p>
      ) : (
        <div className="flex flex-col gap-6">
          {media.docs.map((file) => {
            const image = Boolean(file.mimeType?.startsWith('image/') && file.url)
            return (
              <article className="flex flex-col gap-3 rounded-xl bg-card p-4 text-sm ring-1 ring-foreground/10" key={file.id}>
                <div className="flex items-start gap-4">
                  {image && file.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-muted object-cover text-xs text-muted-foreground" src={file.url} alt={file.alt} />
                  ) : (
                    <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-muted object-cover text-xs text-muted-foreground" aria-hidden="true">
                      File
                    </div>
                  )}
                  <div className="flex min-w-0 flex-1 flex-col gap-4">
                    <StaffForm action={updateMedia} submitLabel="Save file">
                      <input type="hidden" name="id" value={String(file.id)} />
                      <TextField label="Alt text" name="alt" required defaultValue={file.alt} />
                      <TextField label="Replace file" name="file" type="file" />
                    </StaffForm>
                    <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      {file.filename || 'Untitled'}
                      {file.filesize ? ` · ${formatBytes(file.filesize)}` : ''}
                      {file.url ? (
                        <>
                          {' '}
                          ·{' '}
                          <a href={file.url} target="_blank" rel="noreferrer">
                            Open file
                          </a>
                        </>
                      ) : null}
                    </p>
                    <ConfirmButton
                      action={deleteMedia}
                      hiddenFields={{ id: String(file.id) }}
                      label="Delete file"
                      confirmMessage={`Delete ${file.filename || 'this file'}?`}
                    />
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
      <Pager page={media.page || page} totalPages={media.totalPages} path="/staff/media" params={{ q }} />
    </section>
  )
}
