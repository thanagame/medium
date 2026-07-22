'use client';

import { useState, type SyntheticEvent, type MouseEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AppBar,
  Box,
  Button,
  Container,
  IconButton,
  InputBase,
  Menu,
  MenuItem,
  Toolbar,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material';
import EditNoteIcon from '@mui/icons-material/EditNote';
import SearchIcon from '@mui/icons-material/Search';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { useAuth } from '@/lib/useAuth';
import { useColorMode } from '@/app/providers';
import UserAvatar from './UserAvatar';

// สไตล์ร่วมของปุ่ม login/register (ต่างกันแค่ px)
const authButtonSx = {
  flexShrink: 0,
  whiteSpace: 'nowrap',
  minWidth: { xs: 0, sm: 64 },
  fontSize: { xs: '0.8rem', sm: '0.875rem' },
};

export default function Navbar() {
  const router = useRouter();
  const { ready, isAuthenticated, user, logout } = useAuth();
  const { mode, toggle } = useColorMode();
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);
  const [search, setSearch] = useState('');

  const openMenu = (e: MouseEvent<HTMLElement>) => setAnchor(e.currentTarget);
  const closeMenu = () => setAnchor(null);

  const onSearch = (e: SyntheticEvent) => {
    e.preventDefault();
    const q = search.trim();
    router.push(q ? `/?search=${encodeURIComponent(q)}` : '/');
  };

  const goLogout = () => {
    closeMenu();
    logout();
    router.push('/');
  };

  return (
    <AppBar position="sticky">
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ gap: { xs: 0.5, sm: 2 } }}>
          <Typography
            component={Link}
            href="/"
            sx={{
              fontFamily: 'Georgia, serif',
              fontWeight: 800,
              fontSize: { xs: '1.25rem', sm: '1.5rem' },
              textDecoration: 'none',
              color: 'text.primary',
              flexShrink: 0,
            }}
          >
            Storyline 1234
          </Typography>

          <Box
            component="form"
            onSubmit={onSearch}
            sx={(t) => ({
              display: { xs: 'none', sm: 'flex' },
              alignItems: 'center',
              gap: 1,
              px: 1.5,
              borderRadius: 999,
              bgcolor: alpha(t.palette.text.primary, 0.06),
              flex: 1,
              maxWidth: 360,
            })}
          >
            <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
            <InputBase
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาบทความ"
              sx={{ flex: 1, fontSize: '0.9rem' }}
            />
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          <Tooltip title={mode === 'light' ? 'โหมดมืด' : 'โหมดสว่าง'}>
            <IconButton onClick={toggle} color="inherit" sx={{ p: { xs: 0.5, sm: 1 } }}>
              {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
            </IconButton>
          </Tooltip>

          <Button
            component={Link}
            href="/editor"
            startIcon={<EditNoteIcon />}
            sx={{ color: 'text.secondary', display: { xs: 'none', sm: 'inline-flex' } }}
          >
            เขียนบทความ
          </Button>

          {ready && (isAuthenticated ? (
            <>
              <IconButton onClick={openMenu} size="small" sx={{ ml: 1 }}>
                <UserAvatar
                  name={user?.name}
                  src={user?.avatarUrl}
                  sx={{ width: 34, height: 34 }}
                />
              </IconButton>
              <Menu anchorEl={anchor} open={!!anchor} onClose={closeMenu}>
                <MenuItem
                  component={Link}
                  href={`/profile/${user?.username}`}
                  onClick={closeMenu}
                >
                  โปรไฟล์ของฉัน
                </MenuItem>
                <MenuItem component={Link} href="/me" onClick={closeMenu}>
                  บทความของฉัน
                </MenuItem>
                <MenuItem component={Link} href="/editor" onClick={closeMenu}>
                  เขียนบทความใหม่
                </MenuItem>
                <MenuItem component={Link} href="/settings" onClick={closeMenu}>
                  ตั้งค่าโปรไฟล์
                </MenuItem>
                <MenuItem onClick={goLogout}>ออกจากระบบ</MenuItem>
              </Menu>
            </>
          ) : (
            <>
              <Button
                component={Link}
                href="/login"
                color="inherit"
                sx={{ ...authButtonSx, px: { xs: 0.75, sm: 2 } }}
              >
                เข้าสู่ระบบ
              </Button>
              <Button
                component={Link}
                href="/register"
                variant="contained"
                sx={{ ...authButtonSx, px: { xs: 1, sm: 2 } }}
              >
                สมัครสมาชิก
              </Button>
            </>
          ))}
        </Toolbar>
      </Container>
    </AppBar>
  );
}
