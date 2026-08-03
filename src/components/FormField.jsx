import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { EmailIcon, LockIcon, PhoneIcon, UserIcon } from '../assets';
import { useTheme } from '../theme';
import { scaleFont, scaleModerate } from '../utils';
const ICONS = {
  user: UserIcon,
  email: EmailIcon,
  lock: LockIcon,
  phone: PhoneIcon
};
export function FormField({
  label,
  placeholder,
  value,
  onChangeText,
  icon,
  secureTextEntry,
  editable = true,
  keyboardType,
  autoCapitalize,
  rightElement
}) {
  const theme = useTheme();
  const Icon = icon ? ICONS[icon] : null;
  return <View style={styles.fieldWrap}>
      <Text style={[styles.label, {
      color: theme.text.secondary
    }]}>{label}</Text>
      <View style={[styles.field, {
      backgroundColor: theme.surfaces.card,
      borderColor: theme.colors.cardBorder
    }]}>
        {Icon ? <Icon size={18} color={theme.text.mutedIcon} /> : null}
        <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={theme.text.mutedIcon} secureTextEntry={secureTextEntry} editable={editable} keyboardType={keyboardType} autoCapitalize={autoCapitalize} style={[styles.input, {
        color: theme.text.primary
      }]} />
        {rightElement ? <View style={styles.fieldAction}>{rightElement}</View> : null}
      </View>
    </View>;
}
const styles = StyleSheet.create({
  fieldWrap: {
    marginBottom: scaleModerate(14)
  },
  label: {
    marginBottom: scaleModerate(6),
    paddingLeft: scaleModerate(4),
    fontSize: scaleFont(12),
    fontWeight: '700'
  },
  field: {
    minHeight: scaleModerate(48),
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: scaleModerate(16),
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleModerate(8)
  },
  input: {
    flex: 1,
    fontSize: scaleFont(15),
    paddingVertical: 0
  },
  fieldAction: {
    marginLeft: scaleModerate(8)
  }
});
export default FormField;
