import { useCallback, useEffect, useRef, useState } from 'react';
import Cropper, { ReactCropperElement } from 'react-cropper';

import { useUI } from '@components/context';
import { Loading } from '@components/core';
import { DashboardLayout } from '@components/layout';
import { Button } from '@components/ui';
import DragDrop from '@components/ui/DragDrop';

import { useSession } from '@lib/hooks/use-session';
import { updateDisplayName } from '@lib/update-display-name';
import { fetcher } from '@lib/fetcher';

import 'cropperjs/dist/cropper.css';

export default function ProfilePage() {
  const { user, mutate } = useSession();
  const cropperRef = useRef<ReactCropperElement>(null);

  const [displayName, setDisplayName] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loadingFlags, setLoadingFlags] = useState({
    displayName: false,
    picture: false,
    changed: false,
  });

  const { showNoti } = useUI();

  const handleUpload = useCallback(async () => {
    const cropperElem = cropperRef.current;
    if (!file || !cropperElem) return;

    try {
      setLoading(true);

      const { url, fields } = await fetcher<{ url: string; fields: { [key: string]: string } }>(
        `/api/aws/presigned-post?key=${file.name}`,
      );

      const formData = new FormData();
      Object.entries({ ...fields }).forEach(([key, value]) => {
        formData.append(key, value);
      });

      const croppedFile = await new Promise<Blob>((resolve, reject) =>
        cropperElem.cropper.getCroppedCanvas().toBlob((blob) => {
          if (!blob) reject('Blob is null');
          else resolve(blob);
        }),
      );

      formData.append('file', croppedFile, file.name);

      const response = await fetch(url, { method: 'POST', body: formData });
      if (!response.ok) {
        throw new Error(await response.text());
      }

      await fetcher(`/api/aws/presigned-post?key=${file.name}`, { method: 'POST' });

      // combine that use ky?
      await fetcher(`/api/user/profile?key=${file.name}`, { method: 'POST' });
      mutate();

      setPreviewUrl('');
      setFile(null);

      showNoti({ title: 'Succesfully Uploaded!' });
    } catch (err) {
      showNoti({ variant: 'alert', title: err.name, content: err.message });
    } finally {
      setLoading(false);
    }
  }, [file, showNoti, mutate]);

  useEffect(() => {
    if (user && !loadingFlags.changed) {
      setDisplayName(user.displayName);
    }
  }, [user, loadingFlags.changed]);

  const handleUpdateDisplayName = useCallback(
    (displayName: string) => {
      if (!displayName || loadingFlags.displayName) return;
      setLoadingFlags((prev) => ({ ...prev, displayName: true }));
      updateDisplayName(displayName)
        .then(() => {
          mutate();
          setLoadingFlags((prev) => ({ ...prev, changed: false }));
          showNoti({ title: `Diaplay Name has been successfuly changed to '${displayName}'.` });
        })
        .catch((err) => showNoti({ variant: 'alert', title: err.name, content: err.message }))
        .finally(() => setLoadingFlags((prev) => ({ ...prev, displayName: false })));
    },
    [loadingFlags.displayName, mutate, showNoti],
  );

  if (!user || displayName === null) return <Loading />;

  return (
    <div className="max-w-screen-md mx-auto">
      <div className="mt-6">
        <h2 className="text-3xl font-medium">Profile</h2>
        <p className="mt-3 text-gray-700">
          This information will be displayed publicly so be careful what you share.
        </p>
      </div>

      {/* name section */}
      <div className="mt-8 p-4 border border-gray-200 rounded-lg">
        <h4 className="text-lg font-medium text-gray-700">Name</h4>
        <p className="mt-1.5 text-sm text-gray-500">
          Used to identify you by admin. Please contact{' '}
          <a className="text-teal-700 hover:opacity-70" href="mailto:kimjh@bawi.org">
            admin
          </a>
          &nbsp;if you want to change this field.
        </p>
        <form className="mt-4 grid grid-cols-12 gap-6">
          <div className="col-span-12 sm:col-span-6">
            <label htmlFor="full-name" className="text-sm font-medium text-gray-700 hidden">
              Full name
            </label>
            <input
              type="text"
              name="full-name"
              id="full-name"
              disabled
              value={user.name}
              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500"
            />
          </div>
          <div className="col-span-12 sm:col-span-6 flex justify-end">
            <Button type="submit" disabled size="sm">
              Save
            </Button>
          </div>
        </form>
      </div>

      {/* displayName section */}
      <div className="mt-8 p-4 border border-gray-200 rounded-lg">
        <h4 className="text-lg font-medium text-gray-700">Display Name</h4>
        <p className="mt-1.5 text-sm text-gray-500">
          This could be your first name, or a nickname - however you&apos;d like people to refer to
          you in Mighty Network 23rd.
        </p>
        <form
          className="mt-4 grid grid-cols-12 gap-6"
          onSubmit={(e) => {
            e.preventDefault();
            handleUpdateDisplayName(displayName);
          }}
        >
          <div className="col-span-12 sm:col-span-6">
            <label htmlFor="displayName" className="text-sm font-medium text-gray-700 hidden">
              Display Name
            </label>
            <input
              type="text"
              name="displayName"
              id="displayName"
              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500"
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value);
                setLoadingFlags((prev) => ({ ...prev, changed: true }));
              }}
            />
          </div>
          <div className="col-span-12 sm:col-span-6 flex justify-end">
            <Button
              type="submit"
              disabled={
                loadingFlags.displayName ||
                user.displayName === displayName.trim() ||
                displayName.trim().length < 2
              }
              size="sm"
            >
              Save
            </Button>
          </div>
        </form>
      </div>

      {/* TODO: add profile picture section */}
      <div className="mt-8 p-4 border border-gray-200 rounded-lg">
        <h4 className="text-lg font-medium text-gray-700 mb-2">Profile</h4>

        {previewUrl && (
          <div className="relative my-4 grid grid-cols-3 gap-4 w-full">
            <div className="col-span-2">
              <h6 className="font-semibold mb-2">Selected Image</h6>
              <Cropper
                className="max-h-[400px] rounded-md shadow-md"
                alt="preview image"
                preview=".crop-preview"
                background={false}
                src={previewUrl}
                aspectRatio={1}
                minCropBoxHeight={10}
                minCropBoxWidth={10}
                guides={false}
                ref={cropperRef}
              />
            </div>
            <div className="self-end justify-self-center">
              <h6 className="font-semibold mb-2 text-center">Preview</h6>
              <div className="crop-preview overflow-hidden rounded-full shadow-md w-full h-[100px]" />
            </div>
          </div>
        )}
        <DragDrop
          onDropFile={(file) => {
            setPreviewUrl(URL.createObjectURL(file));
            setFile(file);
          }}
        />
        <div className="flex justify-end">
          <Button disabled={loading || !file} onClick={handleUpload} className="text-right mt-4">
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}

ProfilePage.Layout = DashboardLayout;
