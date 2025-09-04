import { memo } from 'react';
import { InfoHoverCard, ESide } from '@librechat/client';
import { PermissionTypes, Permissions } from 'librechat-data-provider';
import SlashCommandSwitch from './SlashCommandSwitch';
import { useLocalize, useHasAccess } from '~/hooks';
import PlusCommandSwitch from './PlusCommandSwitch';
import AtCommandSwitch from './AtCommandSwitch';

function Commands() {
  const localize = useLocalize();

  const hasAccessToPrompts = useHasAccess({
    permissionType: PermissionTypes.PROMPTS,
    permission: Permissions.USE,
  });

  const hasAccessToMultiConvo = useHasAccess({
    permissionType: PermissionTypes.MULTI_CONVO,
    permission: Permissions.USE,
  });

  return (
    <div className="space-y-4 p-1">
      <div className="flex items-center gap-2">
        <h3 className="text-2xl font-medium text-text-primary">
          {localize('com_nav_chat_commands')}
        </h3>
        <InfoHoverCard side={ESide.Bottom} text={localize('com_nav_chat_commands_info')} />
      </div>
      <div className="flex flex-col gap-3 text-base text-text-primary">
        <div className="pb-3">
          <AtCommandSwitch />
        </div>
        {hasAccessToMultiConvo === true && (
          <div className="pb-3">
            <PlusCommandSwitch />
          </div>
        )}
        {hasAccessToPrompts === true && (
          <div className="pb-3">
            <SlashCommandSwitch />
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(Commands);
