import {it,expect} from 'vitest';
import {createElement} from 'react';
import {render,screen,cleanup} from '@testing-library/react';
import {showAndroidDownload,DownloadPage,DownloadApp} from '../src/components/DownloadApp';
it('never offers APK from installed Android app',()=>{expect(showAndroidDownload(true)).toBe(false);expect(showAndroidDownload(false)).toBe(true);});
it('shows web CTA and accurately labels download intent',()=>{render(createElement(DownloadApp));expect(screen.getByRole('link',{name:/Get Android app/}).getAttribute('href')).toBe('/download');cleanup();render(createElement(DownloadPage));expect(screen.getByRole('link',{name:/Download Android APK/}).getAttribute('href')).toBe('/api/download');expect(screen.getByText(/not confirmed completed downloads or installations/)).toBeTruthy();cleanup();});
