import { Outlet } from 'react-router-dom';
import PublicNavbar from './PublicNavbar';
import PublicFooter from './PublicFooter';
import { CustomBlocks, SiteEditorControls } from './SiteEditor';
import { SiteEditorProvider } from './SiteEditorContext';

export default function PublicLayout() {
  return (
    <SiteEditorProvider>
      <div className="flex flex-col min-h-screen">
        <PublicNavbar />
        <main className="flex-1 pt-16">
          <Outlet />
          <CustomBlocks />
        </main>
        <PublicFooter />
        <SiteEditorControls />
      </div>
    </SiteEditorProvider>
  );
}