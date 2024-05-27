import 'cropperjs/dist/cropper.css';

import { NextSeo } from 'next-seo';
import { useCallback, useEffect, useRef, useState } from 'react';
import Cropper, { ReactCropperElement } from 'react-cropper';

import { useUI } from '@components/context';
import { Loading } from '@components/core';
import { DashboardLayout } from '@components/layout';
import { Button } from '@components/ui';
import DragDrop from '@components/ui/DragDrop';
import { fetcher } from '@lib/fetcher';
import { useSession } from '@lib/hooks/use-session';
import { updateDisplayName } from '@lib/update-display-name';
import { updatePassword } from '@lib/update-password';

export default function ProfilePage() {
  const { user, mutate } = useSession();
  const cropperRef = useRef<ReactCropperElement>(null);
  const [password, setPassword] = useState<{ new: string; confirm: string }>({
    new: '',
    confirm: '',
  });

  const [displayName, setDisplayName] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const [previewUrl, setPreviewUrl] = useState('');
  const [loadingFlags, setLoadingFlags] = useState({
    displayName: false,
    picture: false,
    changed: false,
    password: false,
    image: false,
  });

  const { showNoti } = useUI();

  const handleChangePassword = useCallback(
    async (password: string) => {
      try {
        setLoadingFlags((prev) => ({ ...prev, password: true }));

        await updatePassword(password);

        showNoti({ title: 'Password changed!' });
      } catch (err) {
        if (err.status === 304)
          showNoti({
            variant: 'alert',
            title: 'Invalid Password Input',
            content: 'New password matches current password ',
          });
        else {
          showNoti({
            variant: 'alert',
            title: err.name,
            content: err.message,
          });
        }
      } finally {
        setPassword({ new: '', confirm: '' });
        setLoadingFlags((prev) => ({ ...prev, password: false }));
      }
    },
    [showNoti],
  );

  const handleUpload = useCallback(async () => {
    const cropperElem = cropperRef.current;
    if (!file || !cropperElem) return;

    try {
      setLoadingFlags((prev) => ({ ...prev, image: true }));

      // const { url, fields } = await fetcher<{ url: string; fields: { [key: string]: string } }>(
      //   `/api/aws/presigned-post?key=${file.name}`,
      // );

      const { url, fields, key } = await fetcher
        .get('/api/aws/presigned-post', {
          searchParams: { ext: file.name.split('.')[1].toLowerCase() },
        })
        .json<{ url: string; fields: { [key: string]: string }; key: string }>();

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

      formData.append('file', croppedFile, key);

      const response = await fetch(url, { method: 'POST', body: formData });
      if (!response.ok) {
        throw new Error(await response.text());
      }

      // await fetcher(`/api/aws/presigned-post?key=${file.name}`, { method: 'POST' });
      // await fetcher(`/api/user/profile?key=${file.name}`, { method: 'POST' });

      await fetcher.post('/api/aws/presigned-post', { searchParams: { key } });
      await fetcher.post('/api/user/profile', { searchParams: { key } });
      mutate();

      setPreviewUrl('');
      setFile(null);

      showNoti({ title: 'Succesfully Uploaded!' });
    } catch (err) {
      showNoti({ variant: 'alert', title: err.name, content: err.message });
    } finally {
      setLoadingFlags((prev) => ({ ...prev, image: false }));
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
    <>
      <NextSeo title="Mighty - Profile" />
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
        {/* password section */}
        <div className="mt-8 p-4 border border-gray-200 rounded-lg">
          <h4 className="text-lg font-medium text-gray-700">Change Password</h4>
          <p className="mt-1.5 text-sm text-gray-500">You can change your password here.</p>
          <form className="mt-4 sm:flex justify-between">
            <div className="sm:w-80">
              <label htmlFor="full-name" className="text-sm font-medium text-gray-700">
                New Password
              </label>
              <input
                maxLength={30}
                type="password"
                name="new-password"
                id="new-password"
                onChange={(e) => {
                  setPassword((prev) => ({ ...prev, new: e.target.value }));
                }}
                value={password.new}
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500"
              />
              <label htmlFor="full-name" className="text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <input
                maxLength={30}
                type="password"
                name="confirm-password"
                id="confirm-password"
                onChange={(e) => {
                  setPassword((prev) => ({ ...prev, confirm: e.target.value }));
                }}
                value={password.confirm}
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500"
              />
            </div>
            <div className="mt-4 flex justify-end sm:block sm:self-end">
              <Button
                onClick={() => {
                  handleChangePassword(password.new);
                }}
                type="submit"
                size="sm"
                disabled={
                  loadingFlags.password ||
                  password.new.length < 8 ||
                  password.new.length > 30 ||
                  password.confirm !== password.new
                }
              >
                Save
              </Button>
            </div>
          </form>
        </div>

        {/* displayName section */}
        <div className="mt-8 p-4 border border-gray-200 rounded-lg">
          <h4 className="text-lg font-medium text-gray-700">Display Name</h4>
          <p className="mt-1.5 text-sm text-gray-500">
            This could be your first name, or a nickname - however you&apos;d like people to refer
            to you in Mighty Network 23rd.
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
            <Button
              disabled={loadingFlags.image || !file}
              onClick={handleUpload}
              className="text-right mt-4"
            >
              Save
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

ProfilePage.Layout = DashboardLayout;
