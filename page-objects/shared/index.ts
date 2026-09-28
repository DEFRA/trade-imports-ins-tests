import { type Page } from '@playwright/test';
import { OrganisationPickerPage } from '@page-objects/shared/auth/organisation-picker-page';
import { SignInPage } from '@page-objects/shared/auth/sign-in-page';
import { SignOutPage } from '@page-objects/shared/auth/sign-out-page';

export function createSharedPages(page: Page) {
  return {
    page,
    signIn: new SignInPage(page),
    signOut: new SignOutPage(page),
    organisationPicker: new OrganisationPickerPage(page),
  };
}

export type SharedPages = ReturnType<typeof createSharedPages>;
