; ============================================================================
; CAUSA — Instalador NSIS customizado
; Página de seleção de topologia (Solo vs Escritório)
; ============================================================================

!include "MUI2.nsh"
!include "nsDialogs.nsh"
!include "LogicLib.nsh"
!include "FileFunc.nsh"

; --- Variáveis ---
Var TopologiaDialog
Var TopologiaLabel
Var RadioSolo
Var RadioEscritorio
Var DescLabel
Var Topologia

; Campos PostgreSQL (só aparecem quando "Escritório" é selecionado)
Var PgDialog
Var PgHostLabel
Var PgHostInput
Var PgHost
Var PgPortLabel
Var PgPortInput
Var PgPort
Var PgDatabaseLabel
Var PgDatabaseInput
Var PgDatabase
Var PgUserLabel
Var PgUserInput
Var PgUser
Var PgPasswordLabel
Var PgPasswordInput
Var PgPassword
Var PgInfoLabel

; ============================================================================
; Página 1: Seleção de Topologia
; ============================================================================

Function TopologiaPageCreate
  !insertmacro MUI_HEADER_TEXT "Topologia do CAUSA" "Escolha como o CAUSA será utilizado."

  nsDialogs::Create 1018
  Pop $TopologiaDialog

  ${If} $TopologiaDialog == error
    Abort
  ${EndIf}

  ; Título
  ${NSD_CreateLabel} 0 0 100% 20u "Como você vai usar o CAUSA?"
  Pop $TopologiaLabel
  SendMessage $TopologiaLabel ${WM_SETFONT} $mui.Header.Text.Font 0

  ; Radio: Solo
  ${NSD_CreateRadioButton} 10u 30u 100% 15u "CAUSA Solo — Advogado autônomo, notebook único"
  Pop $RadioSolo

  ; Descrição Solo
  ${NSD_CreateLabel} 30u 47u 90% 20u "Banco de dados SQLite integrado. Tudo no seu computador. Ideal para advogado individual."
  Pop $DescLabel

  ; Radio: Escritório
  ${NSD_CreateRadioButton} 10u 75u 100% 15u "CAUSA Escritório — Múltiplos advogados na rede local"
  Pop $RadioEscritorio

  ; Descrição Escritório
  ${NSD_CreateLabel} 30u 92u 90% 25u "Banco PostgreSQL em servidor compartilhado. Suporta 2 a 100 advogados simultâneos na mesma rede."
  Pop $DescLabel

  ; Selecionar Solo por padrão
  ${If} $Topologia == "escritorio"
    ${NSD_Check} $RadioEscritorio
  ${Else}
    ${NSD_Check} $RadioSolo
    StrCpy $Topologia "solo"
  ${EndIf}

  nsDialogs::Show
FunctionEnd

Function TopologiaPageLeave
  ${NSD_GetState} $RadioSolo $0
  ${If} $0 == ${BST_CHECKED}
    StrCpy $Topologia "solo"
  ${Else}
    StrCpy $Topologia "escritorio"
  ${EndIf}
FunctionEnd

; ============================================================================
; Página 2: Configuração PostgreSQL (só se Escritório)
; ============================================================================

Function PostgresPageCreate
  ; Pular se topologia é Solo
  ${If} $Topologia == "solo"
    Abort
  ${EndIf}

  !insertmacro MUI_HEADER_TEXT "Conexão PostgreSQL" "Configure a conexão com o banco de dados do escritório."

  nsDialogs::Create 1018
  Pop $PgDialog

  ${If} $PgDialog == error
    Abort
  ${EndIf}

  ; Aviso
  ${NSD_CreateLabel} 0 0 100% 30u "Informe os dados de conexão com o servidor PostgreSQL.$\r$\nO banco 'causa' deve estar criado previamente no servidor."
  Pop $PgInfoLabel

  ; Host
  ${NSD_CreateLabel} 0 38u 80u 12u "Host / IP:"
  Pop $PgHostLabel
  ${NSD_CreateText} 85u 36u 200u 14u "192.168.1.100"
  Pop $PgHostInput
  ${If} $PgHost != ""
    ${NSD_SetText} $PgHostInput $PgHost
  ${EndIf}

  ; Porta
  ${NSD_CreateLabel} 0 58u 80u 12u "Porta:"
  Pop $PgPortLabel
  ${NSD_CreateText} 85u 56u 60u 14u "5432"
  Pop $PgPortInput
  ${If} $PgPort != ""
    ${NSD_SetText} $PgPortInput $PgPort
  ${EndIf}

  ; Database
  ${NSD_CreateLabel} 0 78u 80u 12u "Banco:"
  Pop $PgDatabaseLabel
  ${NSD_CreateText} 85u 76u 200u 14u "causa"
  Pop $PgDatabaseInput
  ${If} $PgDatabase != ""
    ${NSD_SetText} $PgDatabaseInput $PgDatabase
  ${EndIf}

  ; Usuário
  ${NSD_CreateLabel} 0 98u 80u 12u "Usuário:"
  Pop $PgUserLabel
  ${NSD_CreateText} 85u 96u 200u 14u "causa"
  Pop $PgUserInput
  ${If} $PgUser != ""
    ${NSD_SetText} $PgUserInput $PgUser
  ${EndIf}

  ; Senha
  ${NSD_CreateLabel} 0 118u 80u 12u "Senha:"
  Pop $PgPasswordLabel
  ${NSD_CreatePassword} 85u 116u 200u 14u ""
  Pop $PgPasswordInput
  ${If} $PgPassword != ""
    ${NSD_SetText} $PgPasswordInput $PgPassword
  ${EndIf}

  nsDialogs::Show
FunctionEnd

Function PostgresPageLeave
  ${If} $Topologia == "solo"
    Return
  ${EndIf}

  ${NSD_GetText} $PgHostInput $PgHost
  ${NSD_GetText} $PgPortInput $PgPort
  ${NSD_GetText} $PgDatabaseInput $PgDatabase
  ${NSD_GetText} $PgUserInput $PgUser
  ${NSD_GetText} $PgPasswordInput $PgPassword

  ; Validação básica
  ${If} $PgHost == ""
    MessageBox MB_OK|MB_ICONEXCLAMATION "O Host/IP do servidor PostgreSQL é obrigatório."
    Abort
  ${EndIf}

  ${If} $PgPassword == ""
    MessageBox MB_OK|MB_ICONEXCLAMATION "A senha do PostgreSQL é obrigatória."
    Abort
  ${EndIf}
FunctionEnd

; ============================================================================
; Hooks de instalação: gravar config de topologia
; ============================================================================

!macro customInstall
  ; Resolver %PROGRAMDATA% em runtime usando registrador $R9 (não requer Var)
  ExpandEnvStrings $R9 "%PROGRAMDATA%\CAUSA SISTEMAS\CAUSA"

  ; Criar diretório compartilhado em ProgramData para dados do CAUSA
  CreateDirectory "$R9"
  CreateDirectory "$R9\logs"

  ; Conceder permissão de escrita para todos os usuários no diretório de dados
  nsExec::ExecToLog 'icacls "$R9" /grant *S-1-5-32-545:(OI)(CI)M /T'

  ; Grava arquivo de configuração com topologia escolhida (em ProgramData, compartilhado)
  FileOpen $0 "$R9\causa-install.json" w

  ${If} $Topologia == "escritorio"
    FileWrite $0 '{"topologia":"escritorio","postgresUrl":"postgresql://$PgUser:$PgPassword@$PgHost:$PgPort/$PgDatabase"}'
  ${Else}
    FileWrite $0 '{"topologia":"solo"}'
  ${EndIf}

  FileClose $0

  ; Também grava no INSTDIR como fallback
  FileOpen $0 "$INSTDIR\causa-install.json" w

  ${If} $Topologia == "escritorio"
    FileWrite $0 '{"topologia":"escritorio","postgresUrl":"postgresql://$PgUser:$PgPassword@$PgHost:$PgPort/$PgDatabase"}'
  ${Else}
    FileWrite $0 '{"topologia":"solo"}'
  ${EndIf}

  FileClose $0
!macroend

; ============================================================================
; Registrar páginas customizadas
; ============================================================================

!macro customHeader
  ; Páginas customizadas antes da instalação
!macroend

!macro preInit
  ; Definir diretório de instalação padrão: C:\Program Files\CAUSA SISTEMAS\CAUSA
  StrCpy $INSTDIR "$PROGRAMFILES\CAUSA SISTEMAS\CAUSA"

  ; Inicializar variáveis
  StrCpy $Topologia "solo"
  StrCpy $PgHost "192.168.1.100"
  StrCpy $PgPort "5432"
  StrCpy $PgDatabase "causa"
  StrCpy $PgUser "causa"
  StrCpy $PgPassword ""
!macroend

; Inserir páginas customizadas no fluxo do instalador
Page custom TopologiaPageCreate TopologiaPageLeave
Page custom PostgresPageCreate PostgresPageLeave
